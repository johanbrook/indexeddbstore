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

		this.options = options || {};
		this.name = this.options.dbName || DEFAULT_DB_NAME;

		connect(this.name);
	}

	// Alias 'utils'
	var Utils = IndexedDBStore.Utils = require("./utils");

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

		// when db is first created, or version bumped? 
		openDbRequest.onupgradeneeded = function(evt) {
		   var thisDb = evt.target.result;

		   if ( !thisDb.objectStoreNames.contains(STORE_NAME) ) {
		      thisDb.createObjectStore(STORE_NAME, { autoIncrement: true });
		   }

		};

		return Utils.toPromise(openDbRequest);
	}

	function getStore(mode) {
		var defer = Q.defer();
		return connect().then(function(db) {
			return db.transaction([STORE_NAME], mode || 'readonly').objectStore(STORE_NAME);
		});
	}

	IndexedDBStore.prototype = {

		all: function() {
			return getStore().then(function(store) {
				var records = [];
				var request = store.openCursor();
					
				return Utils.toPromise(request, {
					success: function(evt, defer) {
						var cursor = evt.target.result;

						if(cursor) {
							records.push( cursor.value );
							cursor.continue();
						}
						else {
							defer.resolve(records);
						}
					}
				});
			});
		},

		save: function(blob) {

			function saveToDb(data) {
				return getStore('readwrite').then(function(store) {
					var request = store.put(data);
					return Utils.toPromise(request);
				});
			}

			return Array.isArray(blob) ? 
				Q.all( blob.map(function(b) {
					return Utils.blobToJSON(b).then(saveToDb);
				}))

				: Utils.blobToJSON(blob).then(saveToDb);
		},

		create: function(blob) {
			return this.save(blob).then(this.get.bind(this))
		},

		size: function() {
			return getStore().then(function(store) {
				var request = store.count();
				return Utils.toPromise(request);
			});	
		},

		get: function(id) {
			return getStore().then(function(store) {

				function getRecord(recordId) {
					return Utils.toPromise(store.get(recordId));
				}

				return Array.isArray(id) ? Q.all(id.map(getRecord)) : getRecord(id);
			});
		},

		getAsString: function(id) {
			return this.get(id).then(function(record) {
				return Utils.arrayBufferToBinaryString(record.data);
			});
		},

		clear: function() {
			return getStore('readwrite').then(function(store) {
				var request = store.clear();
				return Utils.toPromise(request);				
			});
		}

	};

	// Exports to module and browser scope

	module.exports = root.IndexedDBStore = IndexedDBStore;

})();
