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
			var blob = new Blob(["Test"]),
				blob2 = new Blob(["Test"], {type: "text/plain"})
			
			return Q.all([
				Utils.blobToJSON(blob).then(function(json) {
					json.should.be.an("Object");
					(json.data instanceof ArrayBuffer).should.be.true
					json.type.should.equal('')
				}),
				Utils.blobToJSON(blob2).then(function(json) {
					json.should.be.an("Object")
					json.type.should.equal("text/plain")
				})
			])
		})
	})
})




describe("IndexedDBStore", function() {

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

	describe("#all", function() {
		it("should return no elements on default", function() {
			return db.all().then(function(records) {
				records.length.should.equal(0)
			})
		})

		it("should retrieve all records in store", function() {
			return Q.all([
				db.create("Test 1"),
				db.create("Test 2")
			])
			.then(function(records) {
				// Check length
				records.length.should.equal(2)

				// Check individual records
				return Q.all([
					IndexedDBStore.Utils.arrayBufferToBinaryString(records[0].data),
					IndexedDBStore.Utils.arrayBufferToBinaryString(records[1].data)
				])
				.then(function(results) {
					results[0].should.equal("Test 1")
					results[1].should.equal("Test 2")
				})
			})
		})
	})

	describe("#save", function() {
		it("should save a record and return an id", function() {
			return addRecord("Test")
			.then(function(id) {
				id.should.be.a("Number")

				return Q.all([
					db.all().then(function(records) {
						records.length.should.equal(1)
					})
				,	
					db.getAsString(id).should.eventually.equal("Test")
				])
			})
		})

		it("should save a Blob", function() {
			var blob = new Blob(["Test"], {type: "text/plain"})
			return db.save(blob).should.eventually.be.a("Number")
		})

		it("should save several Blobs from an array", function() {
			var blobs = [
				new Blob(["Test"], {type: "text/plain"}),
				new Blob(["Test 2"], {type: "text/plain"})
			]

			return db.save(blobs).then(function(ids) {
				ids.should.be.an("Array")
				ids.length.should.equal(2)
			})
		})
	})

	describe("#get", function() {
		it("should retrieve a given record", function() {
			return addRecord("Test").then(db.get.bind(db)).then(function(record) {
				// "Test" has 4 bytes
				record.data.byteLength.should.equal(4)
				IndexedDBStore.Utils.arrayBufferToBinaryString(record.data)
					.should.eventually.equal("Test")
			})
		})

		it("should retrieve given records from an array of ids", function() {
			var blobs = [
				new Blob(["Test"], {type: "text/plain"}),
				new Blob(["Test 2"], {type: "text/plain"})
			]

			return db.save(blobs).then(db.get.bind(db)).then(function(records) {
				records.length.should.equal(2)

				return Q.all([
					IndexedDBStore.Utils.arrayBufferToBinaryString(records[0].data)
					.should.eventually.equal("Test")
					
					,

					IndexedDBStore.Utils.arrayBufferToBinaryString(records[1].data)
						.should.eventually.equal("Test 2")
					]
				)
			})
		})
	})

	describe("#create", function() {
		it("should create a record and return it", function() {
			return db.create("Test").then(function(record) {
				record.data.byteLength.should.equal(4)

				return IndexedDBStore.Utils.arrayBufferToBinaryString(record.data)
					.should.eventually.equal("Test")
			})
		})

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

		it("should create several Blobs from an array", function() {
			var blobs = [
				new Blob(["Test"], {type: "text/plain"}),
				new Blob(["Test 2"], {type: "text/plain"})
			]

			return db.create(blobs).then(function(ids) {
				ids.should.be.an("Array")
				ids.length.should.equal(2)
			})
		})
	})

	describe("#getAsString", function() {
		it("should retrieve a given record as a binary string", function() {
			return addRecord("Test")
				.then(db.getAsString.bind(db))
				.should.eventually.equal("Test")
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
