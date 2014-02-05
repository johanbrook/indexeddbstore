var should = chai.should()

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

	it("should be available", function(){
		db.should.not.be.undefined
	})

	it("should have a database name", function() {
		db.name.should.equal("test")
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
