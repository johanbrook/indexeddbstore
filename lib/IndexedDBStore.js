(function() {

	// Reference to `window` in the browser and `exports`
	// on the server.
	var root = this;

	// Require Q, if possible
	var Q = root.Q;
	if (!Q && (typeof require !== 'undefined')) {
		Q = require('q');
	}

	var STORE_NAME = "test",
		VERSION = 2;

	function IndexedDBStore(options) {
		if(!(this instanceof IndexedDBStore)) return new IndexedDBStore(options);
	
		this._db = window.indexedDB ||
					window.webkitIndexedDB ||
					window.mozIndexedDB || 
					window.OIndexedDB || 
					window.msIndexedDB;

		this.options = options;
		this.name = this.options.dbName;

		if(!this._db) {
			throw new Error("IndexedDB does not seem to be supported in your environment");
		}
		else {
			getDb.call(this);
		}
	}

	function getDb() {
		var openDbRequest = this._db.open(this.name, VERSION);
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
			var db = evt.target.result;
			defer.resolve(db);
		};

		openDbRequest.onerror = function(evt) {
			defer.reject(evt.target.error);
		};

		return defer.promise;
	}


	IndexedDBStore.prototype = {

		all: function() {
			return getDb.call(this).then(function(db) {
				var records = [];
				var store = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME);
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

		save: function(blob) {
			return getDb.call(this).then(function(db) {
				var store = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME);
				var request = store.put(blob);
				var defer = Q.defer();

				request.onerror = function(evt) {
					defer.reject(evt.target.error);
				};

				request.onsuccess = function(evt) {
				   defer.resolve(blob);
				};

				return defer.promise;
			});
		},

		size: function() {
			return getDb.call(this).then(function(db) {
				var store = db.transaction([STORE_NAME]).objectStore(STORE_NAME);
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
			return getDb.call(this).then(function(db) {
				var store = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME);
				var request = store.get(id);
				var defer = Q.defer();

				request.onerror = function(evt) {
					defer.reject(evt.target.error);
				};

				request.onsuccess = function(evt) {
					defer.resolve(evt.result);
				};

				return defer.promise;
			});
		},

		clear: function() {
			return getDb.call(this).then(function(db) {
				var store = db.transaction([STORE_NAME], 'readwrite').objectStore(STORE_NAME);
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

	// Exports

	if (typeof exports !== 'undefined') {
	  if (typeof module !== 'undefined' && module.exports) {
	    root = module.exports = IndexedDBStore;
	  }
	  root.IndexedDBStore = IndexedDBStore;
	} else {
	  root.IndexedDBStore = IndexedDBStore;
	}

})();
