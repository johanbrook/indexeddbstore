var should = chai.should()

var URL_REGEX = /^blob.+\/[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}/,
		GUID_REGEX = /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/

// Helpers

function getLocalFile(filename) {
	var xhr = new XMLHttpRequest(),
		defer = Q.defer()

	xhr.responseType = 'blob'

	xhr.onreadystatechange = function(evt) {
		if(evt.target.readyState === 4 && evt.target.status === 200) {
			defer.resolve(xhr.response)
		}
	}
	xhr.ontimeout = xhr.onerror = function(evt) {
		defer.reject(evt)
	}

	xhr.open("GET", "/test/"+filename, true)
	xhr.send()

	return defer.promise
}


describe("IndexedDBStore", function() {

	var db,
		// Do db clean-up after each test and delete database
		// after test suite.
		clean = true

	// Before each test

	beforeEach(function() {
		db = new IndexedDBStore({
			dbName: "test"
		})

		if(clean) {
			return db.clear()
		}
	})

	// After test suite

	after(function() {
		// Remove IndexedDB database
		var indexedDB = window.indexedDB ||
					window.webkitIndexedDB ||
					window.mozIndexedDB ||
					window.OIndexedDB ||
					window.msIndexedDB;

		if(clean) {
			indexedDB.deleteDatabase("test")
			indexedDB.deleteDatabase("test_several")
		}
	})

	// Helpers

	function addRecord(record) {
		return db.save(record)
	}

	it("should be available", function(){
		db.should.not.be.undefined
	})

	it("should have a database name", function() {
		db.name.should.equal("test")
	})

	it("should have a default database name", function() {
		var db2 = new IndexedDBStore()
		db2.name.should.equal("DEFAULT")
	})


	describe("Multiple stores", function() {
		var db2;

		beforeEach(function() {
			db2 = new IndexedDBStore({
				dbName: 'test_several',
				stores: ['store1', 'store2']
			})
		})

		it("should support creating several stores in constructor", function() {
			db2.stores.should.contain('store1', 'store2')
		})

		it("should work with the first specified store as default", function(){
			return db2._getStore().then(function(store) {
				store.name.should.equal('store1')
			})
		})

		describe("use", function() {
			it("should provide a way of selecting which store to work on", function() {
				return db2.use('store2')._getStore().then(function(store) {
					store.name.should.equal('store2')
				})
			})

			it("should remember the latest store used", function(){
				return db2.use("store2").save("Test 1").then(function(guid) {
					return db2.get(guid).then(function(record){
						(record === undefined).should.be.false
					})
				})
			})

			it("should throw error if called with a non-existing store", function(){
				// from https://github.com/chaijs/chai/issues/71
				(function() {
					db2.use("store3")
				}).should.throw(Error)
			})

			it("should let you save resources in different stores", function() {
				return db2.use("store2").save("Test 1").then(function(guid) {
					return db2.use("store1").get(guid).then(function(record){
						(record === undefined).should.be.true
					})
				})
			})
		})
	})

	describe("all", function() {
		it("should return no elements on default", function() {
			return db.all().then(function(records) {
				records.length.should.equal(0)
			})
		})

		it("should retrieve all records in store", function() {
			return Q.all([
				db.create({foo: "foo"}),
				db.create({bar: "bar"})
			])
			.spread(function(foo, bar) {
				// Check individual records
				foo.data.foo.should.equal("foo")
				bar.data.bar.should.equal("bar")
			})
		})

		it('should retrieve all records with a GUID key', function(){
			return db.create({foo: "bar"})
				.then(function(record) {
						return record.guid.should.match(GUID_REGEX)
				})
		})
	})

	describe("save", function() {
		it("should save a record and return an id", function() {
			return db.save({foo: "bar"})
			.then(function(id) {
				id.should.be.a("String")
				id.should.match(GUID_REGEX)
			})
		})

		describe("save (with given GUID)", function() {
			it("should save a record with a given GUID", function() {
				var guid = IndexedDBStore.Utils.guid()
				return db.save(guid, "Test").then(function(id) {
					id.should.be.a("String")
					id.should.match(GUID_REGEX)
					id.should.equal(guid)
				})
			})
		})

		it("should save several records from an array", function() {
			var records = [
				{foo: "bar"},
				{bar: "foo"}
			]

			return db.save(records).then(function(ids) {
				ids.should.be.an("Array")
				ids.length.should.equal(2)
			})
		})
	})

	describe("get", function() {
		it("should retrieve a given record", function() {
			return db.save({foo: "bar"}).then(db.get.bind(db)).then(function(record) {
				record.should.be.an("Object")
				record.data.foo.should.equal("bar")
			})
		})

		it("should return a record with a GUID", function() {
			return db.save({foo: "bar"}).then(db.get.bind(db)).then(function(record) {
				record.guid.should.exist
				record.guid.should.match(GUID_REGEX)
			})
		})

		it("should retrieve given records from an array of ids", function() {
			var records = [
				{foo: "foo"},
				{foo: "bar"}
			]

			return db.save(records).then(db.get.bind(db)).then(function(records) {
				records.length.should.equal(2)
				records[0].data.foo.should.equal("foo")
				records[1].data.foo.should.equal("bar")
			})
		})
	})

	describe("create", function() {
		it("should create a record and return it", function() {
			return db.create({foo: "bar"}).then(function(record) {
				record.data.foo.should.equal("bar")
			})
		})

/*
		it("should create a record from a given binary file", function() {
			return Q.all([
				getLocalFile("test-image.jpg")
					.then(db.create.bind(db))
					.then(function(record) {
						return record.type.should.equal("image/jpeg")
					})
				,
				getLocalFile("test-pdf.pdf")
					.then(db.create.bind(db))
					.then(function(record) {
						return record.type.should.equal("application/pdf")
					})
			])
		})
*/

		describe("guid (with given GUID)", function() {
			it("should create a record with a given GUID", function() {
				var guid = IndexedDBStore.Utils.guid()

				return db.create(guid, {foo: "bar"}).then(function(record) {
					record.guid.should.equal(guid)
				})
			})
		})

		it("should create several Blobs from an array", function() {
			var records = [
				{foo: "bar"},
				{foo: "foo"}
			]

			return db.create(records).then(function(recs) {
				recs.should.be.an("Array")
				recs.length.should.equal(2)
				recs[0].data.foo.should.equal("bar")
				recs[1].data.foo.should.equal("foo")
			})
		})
	})

	describe("destroy", function() {

		it("should destroy a given record from its GUID", function() {
			var guid;

			return db.save({foo: "bar"})
				.then(function(id) {
					return guid = id
				})
				.then(db.destroy.bind(db))
				.then(function() {
					return db.get(guid)					// try to fetch the record again
				})
				.then(function(rec) {
					var res = rec === undefined	// rec should not exist
					res.should.be.true
				})
		})

		it("should destroy an array of given record GUIDs and return them", function() {
			var guids

			return db.save([ {foo: "bar"}, {bar: "foo"}])
				.then(function(ids) {
					return guids = ids
				})
				.then(db.destroy.bind(db))
				.then(function() {
					return db.get(guids)					// try to fetch the record again
				})
				.then(function(records) {			// values in array should be undefined
					records.every(function(record){ return record === undefined }).should.be.true
				})
			})
	})

	describe("size", function() {
		it("should return zero when there are no records in store", function() {
			return db.size().should.eventually.equal(0)
		})

		it("should return the number of records in the store", function() {
			return addRecord("Johan")
				.then(db.size.bind(db))
				.should.eventually.equal(1)
		})
	})

	describe("clear", function() {
		it("should clear all rows", function() {
			return db.clear()
				.then(db.size.bind(db))
				.should.eventually.equal(0)
		})
	})
})
