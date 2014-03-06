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

describe("Utils", function() {
	var Utils = IndexedDBStore.Utils

	describe("#toObjectURL", function() {
		it("should convert a Blob to an ObjectURL", function() {
			var data = new Blob(["Test"]),
				url = Utils.toObjectURL(data)

			url.should.exist
			url.should.be.a("String")
			url.should.match(URL_REGEX)
		})

		it("should convert arbitrary data to an ObjectURL", function() {
			var data = "Test",
				url = Utils.toObjectURL(data)

			url.should.exist
			url.should.be.a("String")
			url.should.match(URL_REGEX)
		})

		it("should convert an ArrayBuffer to an ObjectURL", function() {
			// First create a buffer from existing util function
			return Utils.blobToArrayBuffer(new Blob(["Test"])).then(function(buffer) {
				var url = Utils.toObjectURL(buffer)
				url.should.exist
				url.should.be.a("String")
				url.should.match(URL_REGEX)
			})
		})
	})

	describe("#blobToArrayBuffer", function() {
		it("should convert a Blob to an ArrayBuffer", function(){
			var blob = new Blob(["Test"])
			return Utils.blobToArrayBuffer(blob).then(function(buffer) {
				(buffer instanceof ArrayBuffer).should.be.true
				buffer.byteLength.should.equal(4)
			})
		})
	})

	describe("#arrayBufferToBlob", function() {
		it("should convert an ArrayBuffer to Blob", function() {
			var blob = new Blob(["Test"])
			return Utils.blobToArrayBuffer(blob).then(function(buffer) {
				var blob2 = Utils.arrayBufferToBlob(buffer)
				blob2.size.should.equal(blob.size)
			})
		})
	})

	describe("#arrayBufferToBinaryString", function() {
		it("should convert an ArrayBuffer to a binary String", function() {
			var blob = new Blob(["Test"])
			return Utils.blobToArrayBuffer(blob)
				.then(Utils.arrayBufferToBinaryString)
				.should.eventually.equal("Test")
		})
	})

	describe("#blobToJSON", function() {
		it("should return a JSON representation of a given Blob", function() {
			var blob = new Blob(["Test"])

			return Utils.blobToJSON(blob).then(function(json) {
				json.should.be.an("Object");
				(json.data instanceof ArrayBuffer).should.be.true
			})
		})

		it("should return a type key for a given Blob", function() {
			var blob = new Blob(["Test"], { type: "text/plain" })

			return Utils.blobToJSON(blob).then(function(json) {
				json.type.should.equal('text/plain')
			})
		})

		it("should return a name key for a given Blob", function() {
			var blob = new Blob(["Test"], { type: "text/plain" })

			return Utils.blobToJSON(blob).then(function(json) {
				json.name.should.equal('')
			})
		})

		it("should return a date key for a given Blob", function() {
			return getLocalFile("test-image.jpg")
				.then(Utils.blobToJSON.bind(Utils))
				.then(function(json) {
					json.date.should.not.be.undefined
					var parsedDate = new Date(json.date)
					parsedDate.toString().should.not.equal("Invalid Date")
				})
		})
	})

	describe("#guid", function() {
		var guid

		beforeEach(function() {
			guid = Utils.guid()
		})

		it("should generate a GUID", function() {
			guid.should.exist
			guid.should.be.a("String")
		})

		it("should be on the form XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX", function() {
			guid.should.match(GUID_REGEX)
		})

		it("should be pseudo-unique", function() {
			var guid2 = Utils.guid()

			guid.should.not.equal(guid2)
		})
	})

	describe("#extend", function() {
		it("should extend a given object", function() {
			var obj = {test: "Test", name: "Johan"}
			var extended = Utils.extend(obj, {test: "Test", name: "John"}, {foo: "bar"})

			extended.test.should.equal("Test")
			extended.name.should.equal("John")
			extended.foo.should.equal("bar")
		})
	})
})




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

		describe("#use", function() {
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

	describe("#all", function() {
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
				foo.foo.should.equal("foo")
				bar.bar.should.equal("bar")
			})
		})

		it('should retrieve all records with a GUID key', function(){
			return db.create({foo: "bar"})
				.then(function(record) {
						return record.guid.should.match(GUID_REGEX)
				})
		})
	})

	describe("#save", function() {
		it("should save a record and return an id", function() {
			return db.save({foo: "bar"})
			.then(function(id) {
				id.should.be.a("String")
				id.should.match(GUID_REGEX)
			})
		})

		describe("#save (with given GUID)", function() {
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

	describe("#get", function() {
		it("should retrieve a given record", function() {
			return db.save({foo: "bar"}).then(db.get.bind(db)).then(function(record) {
				record.should.be.an("Object")
				record.foo.should.equal("bar")
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
				records[0].foo.should.equal("foo")
				records[1].foo.should.equal("bar")
			})
		})
	})

	describe("#create", function() {
		it("should create a record and return it", function() {
			return db.create({foo: "bar"}).then(function(record) {
				record.foo.should.equal("bar")
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

		describe("#guid (with given GUID)", function() {
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
				recs[0].foo.should.equal("bar")
				recs[1].foo.should.equal("foo")
			})
		})
	})


	describe("#size", function() {
		it("should return zero when there are no records in store", function() {
			return db.size().should.eventually.equal(0)
		})

		it("should return the number of records in the store", function() {
			return addRecord("Johan")
				.then(db.size.bind(db))
				.should.eventually.equal(1)
		})
	})

	describe("#clear", function() {
		it("should clear all rows", function() {
			return db.clear()
				.then(db.size.bind(db))
				.should.eventually.equal(0)
		})
	})
})
