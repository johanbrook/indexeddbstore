(function() {

	var Q = require("q");

	var STORE_NAME = "test",
		VERSION = 1;

	function IndexedDBStore(options) {
		if(!(this instanceof IndexedDBStore)) return new DataStorage(options);
	
		this._store = window.indexedDB ||
					window.webkitIndexedDB ||
					window.mozIndexedDB || 
					window.OIndexedDB || 
					window.msIndexedDB;
		
		this.options = options;

		// Init

	}

	function getStore() {
		var openDbRequest = this._store.open(this.options.dbName, VERSION);
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


	IndexedDBStore.prototype = {

		all: function() {
			return getStore.call(this).then(function(db) {
				var store = db.transaction([STORE_NAME], 'readonly').objectStore(STORE_NAME);
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

		save: function(blob, callback) {
			return getStore.call(this).then(function(db) {
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

		read: function(id) {

		}

	};

	module.exports = IndexedDBStore;

})();
