var should = chai.should()

var URL_REGEX = /^blob.+\/[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}/

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
		it("should convert an ArrayBuffer to Blob", function(done) {
			var blob = new Blob(["Test"])
			return Utils.blobToArrayBuffer(blob).then(function(buffer) {
				var blob2 = Utils.arrayBufferToBlob(buffer)
				blob2.size.should.equal(blob.size)
				done()
			})
		})
	})

	describe("#arrayBufferToURL", function() {
		it("should convert an ArrayBuffer to an ObjectURL", function() {
			// First create a buffer from existing util function
			return Utils.blobToArrayBuffer(new Blob(["Test"])).then(function(buffer) {
				var url = Utils.arrayBufferToURL(buffer)
				url.should.exist
				url.should.be.a("String")
				url.should.match(URL_REGEX)
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
})



	this.timeout(4000);

	var db;

	// Before each test

	beforeEach(function() {
		db = new IndexedDBStore({
			dbName: "test"
		})

		return db.clear()
	})

	// After test suite

	after(function() {
		// Remove IndexedDB database
		var indexedDB = window.indexedDB ||
					window.webkitIndexedDB ||
					window.mozIndexedDB || 
					window.OIndexedDB || 
					window.msIndexedDB;

		indexedDB.deleteDatabase("test")
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

	describe("#all()", function() {
		it("should return no elements on default", function() {
			return db.all().then(function(records) {
				records.length.should.equal(0)
			})
		})

		it("should return one element when added", function() {
			return addRecord("test").then(function() {
				return db.all().then(function(records) {
					records.length.should.equal(1)
				})
			})
		})
	})

	describe("#save()", function() {
		it("should save a record and return an id", function() {
			return addRecord("Test")
			.then(function(id) {
				id.should.be.a("number")
			})
		})

		it("should be able to save a Blob", function() {
			var blob = new Blob(["Test"], {type: "text/plain"})
			return db.create(blob).then(function(b) {
				console.log(b)
				true.should.equal(true)
			})
		})
	})

	describe("#create()", function() {
		it("should save a record and return it", function() {
			return db.create("Test").then(function(record) {
				record.should.equal("Test")
			})
		})
	})

	describe("#get()", function() {
		it("should retrieve a given record", function() {
			return addRecord("Test").then(db.get.bind(db)).then(function(record) {
				record.should.equal("Test")
			})

			
		})
	})

	describe("#size()", function() {
		it("should return zero when there are no records in store", function() {
			return db.size().should.eventually.equal(0)
		})

		it("should return the number of records in the store", function() {
			return addRecord("Johan").then(db.size.bind(db)).should.eventually.equal(1)
		})
	})

	describe("#clear()", function() {
		it("should clear all rows", function() {
			return db.clear().then(db.size.bind(db)).should.eventually.equal(0)
		})
	})
})
