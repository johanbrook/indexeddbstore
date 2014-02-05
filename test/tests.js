var should = chai.should()

describe("IndexedDBStore", function() {

	var db;

	// Before each test

	beforeEach(function() {
		db = new IndexedDBStore({
			dbName: "test"
		})

		db.clear()
	})

	// After test suite

	after(function() {
		// Remove IndexedDB database
		db._db.deleteDatabase("test")
	})

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
			return db.save("Test").then(function() {
				return db.all().then(function(records) {
					records.length.should.equal(1)
				})
			})
		})
	})

	describe("#save()", function() {
		it("should save a record", function() {
			return db.save("Test").then(function(record) {
				record.should.equal("Test")
			})
		})
	})

	describe("#get()", function() {
		it("should retrieve a given record", function() {
			return db.save("Test").then(function(record) {
				record.should.equal("Test")

				return db.get("Test").then(function(test) {
					test.should.equal(record).and.equal("Test")
				})
			})
		})
	})

	describe("#clear()", function() {
		it("should clear all rows", function() {
			db.clear()
			return db.all().then(function(records) {
				records.length.should.equal(0)
			})
		})
	})
})
