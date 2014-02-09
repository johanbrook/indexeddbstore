(function() {

	// Reference to `window` in the browser and `exports`
	// on the server.
	var root = this;

	var Q = require("q");

	var DEFAULT_DB_NAME = 	"DEFAULT",
		STORE_NAME = 		"store",
		VERSION = 			2;

	function IndexedDBStore(options) {
		if(!(this instanceof IndexedDBStore)) return new IndexedDBStore(options);

		this.options = options;
		this.name = (this.options && this.options.dbName) || DEFAULT_DB_NAME;

		connect(this.name);
	}

	function connect(name) {
		var indexedDB = window.indexedDB ||
					window.webkitIndexedDB ||
					window.mozIndexedDB || 
					window.OIndexedDB || 
					window.msIndexedDB;

		if(!indexedDB) {
			throw new Error("IndexedDB does not seem to be supported in your environment");
		}

		var openDbRequest = indexedDB.open(name, VERSION);
		var defer = Q.defer();

		// when db is first created, or version bumped? 
		openDbRequest.onupgradeneeded = function(evt) {
		   var thisDb = evt.target.result;

		   if ( !thisDb.objectStoreNames.contains(STORE_NAME) ) {
		      thisDb.createObjectStore(STORE_NAME, { autoIncrement: true });
		   }

		};

		// when the connection to db works?
		openDbRequest.onsuccess = function(evt) {
			defer.resolve(evt.target.result);
		};

		openDbRequest.onerror = function(evt) {
			defer.reject(evt.target.error);
		};

		return defer.promise;
	}

	function getStore(mode) {
		var defer = Q.defer();
		return connect().then(function(db) {
			return db.transaction([STORE_NAME], mode || 'readonly').objectStore(STORE_NAME);
		});
	}

	var Utils = {
		convertToBase64: function(blob) {
			var fr = new FileReader();
			var defer = Q.defer();

			fr.onload = function(evt) {
				defer.resolve(evt.target.result);
			}
			fr.onerror = function(err) {
				defer.reject(err);
			}
			fr.readAsDataURL(blob);

			return defer.promise;
		},

		browser: function() {
			var n = navigator.appName;
			var ua = navigator.userAgent;
			var tem;
			var m = ua.match(/(opera|chrome|safari|firefox|msie)\/?\s*(\.?\d+(\.\d+)*)/i);
			if (m && (tem = ua.match(/version\/([\.\d]+)/i)) != null) m[2] = tem[1];
			m = m ? [m[1], m[2]] : [n, navigator.appVersion, '-?'];
			if ((m[0] == "Netscape") && ua.match(/rv:11/g)) {
				m[0] = "MSIE";
			}
			return { 
				brand: m[0], 
				version: m[1] 
			};
		},

		hasBlobSupport: function() {
			var browser = Utils.browser().brand;
			return browser === "Firefox";
		}
	};

	IndexedDBStore.prototype = {

		all: function() {
			return getStore().then(function(store) {
				var records = [];
				var conn = store.openCursor();
				var defer = Q.defer();

				conn.onerror = function(evt) {
					defer.reject(evt.target.error);
				};

				conn.onsuccess = function(evt) {
					var cursor = evt.target.result;

					if(cursor) {
						records.push( new Blob([ cursor.value ]) );
						cursor.continue();
					}
					else {
						defer.resolve(records);
					}
				};

				return defer.promise;
			});
		},

		save: function(data) {
			var blob = new Blob([data]);

			function saveToDb(obj) {
				return getStore('readwrite').then(function(store) {
					var request = store.put(obj);
					var defer = Q.defer();

					request.onerror = function(evt) {
						defer.reject(evt.target.error);
					};

					request.onsuccess = function(evt) {
						// evt.target.result is the new id
						defer.resolve(evt.target.result);
					};

					return defer.promise;
				});
			}

			return saveToDb(data);

			return (Utils.hasBlobSupport()) ? 
				saveToDb(blob) : Utils.convertToBase64(blob).then(saveToDb);
		},

		create: function(blob) {
			return this.save(blob).then(this.get.bind(this))
		},

		size: function() {
			return getStore().then(function(store) {
				var req = store.count();
				var defer = Q.defer();

				req.onerror = function(evt) {
					defer.reject(evt.target.error);
				};
				req.onsuccess = function(evt) {
					defer.resolve(evt.target.result);
				};

				return defer.promise;
			});	
		},

		get: function(id) {
			return getStore().then(function(store) {
				var request = store.get(id);
				var defer = Q.defer();

				request.onerror = function(evt) {
					defer.reject(evt.target.error);
				};

				request.onsuccess = function(evt) {
					defer.resolve(evt.target.result);
				};

				return defer.promise;
			});
		},

		clear: function() {
			return getStore('readwrite').then(function(store) {
				var defer = Q.defer();
				var request = store.clear();

				request.onerror = function(evt) {
					defer.reject(evt.target.error);
				};

				request.onsuccess = function(evt) {
					defer.resolve();
				};

				return defer.promise;
			});
		}

	};

	// Exports to module and browser scope

	module.exports = root.IndexedDBStore = IndexedDBStore;

})();
