(function() {

	// Reference to `window` in the browser and `exports`
	// on the server.
	var root = this;

	var Q = require("q");

	var DEFAULT_DB_NAME = "DEFAULT",
		STORE_NAME = 			 "store",
		VERSION = 					3;


	function IndexedDBStore(options) {
		if(!(this instanceof IndexedDBStore)) return new IndexedDBStore(options);

		this.options = options || {};
		this.name = this.options.dbName || DEFAULT_DB_NAME;

		this.stores = this.options.stores || [STORE_NAME];
		this._latestStore = this.stores[0];

		this._connect();
	}

	// Alias 'utils'
	var Utils = IndexedDBStore.Utils = require("./utils");

	IndexedDBStore.prototype = {

		_connect: function() {
			var indexedDB = window.indexedDB ||
						window.webkitIndexedDB ||
						window.mozIndexedDB ||
						window.OIndexedDB ||
						window.msIndexedDB;

			if(!indexedDB) {
				throw new Error("IndexedDB does not seem to be supported in your environment");
			}

			var openDbRequest = indexedDB.open(this.name, VERSION);

			// when db is first created, or version bumped?
			openDbRequest.onupgradeneeded = function(evt) {
				var db = evt.target.result;

				this.stores.forEach(function(storeName) {
					if(!db.objectStoreNames.contains(storeName) ) {
						console.log("Creating " +storeName);
						db.createObjectStore(storeName);
					}
				});

			}.bind(this);

			return Utils.toPromise(openDbRequest);
		},

		_getStore: function(mode) {
			var store = this._latestStore;

			return this._connect().then(function(db) {
				return db.transaction([store], mode || 'readonly').objectStore(store);
			});
		},

		use: function(store) {
			if(this.stores.indexOf(store) === -1){
				throw new Error(store + " does not seem to exist.");
			}

			this._latestStore = store;
			return this;
		},

		all: function() {
			return this._getStore().then(function(store) {
				var records = [];
				var request = store.openCursor();

				return Utils.toPromise(request, {
					success: function(evt, defer) {
						var cursor = evt.target.result;

						if(cursor) {
							records.push(Utils.addGUID(cursor.value, cursor.key));
							cursor.continue();
						}
						else {
							defer.resolve(records);
						}
					}
				});
			});
		},

		save: function(guid, blob) {

			var saveToDb = function(data, guid) {
				return this._getStore('readwrite').then(function(store) {
					debugger;
					// Use GUID for key
					var request = store.put(data, guid);
					return Utils.toPromise(request);
				});
			}.bind(this);

			blob = (arguments.length === 1) ? guid : blob;

			if(Array.isArray(blob)) {
				return Q.all( blob.map(function(b) {
					// When saving an array, always generate GUIDs
					return saveToDb(b, Utils.guid());
				}.bind(this)));
			}
			else {
				guid = (arguments.length === 1) ? Utils.guid() : guid;
				return saveToDb(blob, guid);
			}
		},

		create: function(guid, blob) {
			return this.save.apply(this, arguments).then(this.get.bind(this))
		},

		size: function() {
			return this._getStore().then(function(store) {
				var request = store.count();
				return Utils.toPromise(request);
			});
		},

		get: function(guid) {
			return this._getStore().then(function(store) {

				function getRecord(id) {
					return Utils.toPromise(store.get(id), {
						success: function(evt, defer) {
                            if(!evt.target.result) {
                              return defer.resolve(undefined);
                            }
							var record = Utils.addGUID(evt.target.result, id);

							return defer.resolve(record);
						}
					});
				}

				return Array.isArray(guid) ? Q.all(guid.map(getRecord)) : getRecord(guid);
			}.bind(this));
		},

		clear: function() {
			return this._getStore('readwrite').then(function(store) {
				var request = store.clear();
				return Utils.toPromise(request);
			});
		}

	};

	// Exports to module and browser scope

	module.exports = root.IndexedDBStore = IndexedDBStore;

})();
