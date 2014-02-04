var Db = require("../lib/IndexedDBStore");

var db = new Db({
	dbName: "test"
});

function show(blob) {
	console.log(blob);
}

function showError(err) {
	console.error(err);
}

db.save("hej").done(show, showError);

db.all().done(function(records) {
	console.log("Records: ", records);
})



