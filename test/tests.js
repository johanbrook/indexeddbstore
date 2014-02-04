var should = chai.should();

describe("IndexedDBStore", function() {

	var db = new IndexedDBStore({
		dbName: "test"
	});

	beforeEach(function() {
		db.clear();
	});

	it("should have a database name", function() {
		db.name.should.equal("test");
	});
});
