# IndexedDB Data Storage Module

Promise based client-side wrapper for HTML5 IndexedDB in the browser, built with [Browserify](http://browserify.org/).

## API

IndexedDBStore is built according to CommonJS principles. Thus the module is able to be imported in the browser using Browserify and the common `require()` function. Else, `window.IndexedDBStore` is available.

	var IndexedDBStore = require('indexeddbstore')

	var Store = new IndexedDBStore({
		dbName: "DEFAULT",	// String
		stores: ['store']	 // Array with store names to create
	})

	Store.save(Object|Array).then(function(guid) {
		console.log("GUID: ", guid)
		// => String|Array
	})

	Store.save(Object, "existing-guid").then(function(guid) {
		console.log("GUID: ", guid)
		// => String "existing-guid"
	})

	Store.create(Object).then(function(record) {
		console.log("Record: ", record)
		// => Object {data: Object, guid: String}
	})

	// ... Store#create supports the same method signatures as Store#save

	Store.get("guid").then(function(record) {
		console.log("Record: ", record)
		// => Object {data: Object, guid: String}
	})

	Store.get( ["guid1", "guid2"] ).then(function(records) {
		console.log("Records: ", records)
		// => Array [ {data: {foo: "bar"}, guid: String guid1}, {data: {foo: "bar"}, guid: String guid2} ]
	})

	Store.all().then(function(records) {
		console.log("Records: ", records)
		// => Array
	})

	Store.size().then(function(size) {
		console.log("Size: ", size)
		// => Number
	})

	Store.clear().then(function() {
		console.log("Cleared store")
		// Post-con: Store#size() === 0
	})

	Store.use('store-name').save( ... )
	// Returns the same instance but will operate on the specified store name.
	// Will remember the store for next operation.

All methods returns a `Promise`, except for `Store#use`.

## Build tasks

[Gulp](http://gulpjs.com/) is used for build tasks. Be sure to run `npm install` to install all dependencies.

	# Default: builds bundle.js from lib/IndexedDBStore.js
	gulp
	gulp build

	# Watches lib/IndexedDBStore.js for changes and generates a build
	gulp watch

	# Removes `build`
	gulp clean

## Develop

You have to have a watch task running in order to let Browserify build a concatenated file will all dependencies.

	npm install
	gulp watch

A concatenated `bundle.js` will be generated in the `build` directory.

## Tests

Tests reside in the `test/tests.js` file, and uses Mocha and Chai.js.

	gulp test

Tests run in a browser window for now, since headless browsers like PhantomJS don't support the `IndexedDB` API yet (as of PhantomJS 1.9).

## License

MIT.
