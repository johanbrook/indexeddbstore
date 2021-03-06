# IndexedDB Data Storage Module

Promise based client-side wrapper for HTML5 IndexedDB in the browser, built with [Browserify](http://browserify.org/).

## Install

Via NPM:

	npm install indexeddbstore

Or just download [a release](https://github.com/johanbrook/indexeddbstore/releases) package and grab the contents in the `dist` directory and put in a `script` tag.

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

A task for building files ready for distribution is available:

	gulp dist

This will create files `dist/indexeddbstore.js` and `dist/indexeddbstore.min.js`.

A concatenated `bundle.js` will be generated in the `build` directory.

## Tests

Tests reside in the `test/tests.js` file, and uses Mocha and Chai.js.

	gulp test

Visit [http://localhost:3000/test/runner.html](http://localhost:3000/test/runner.html) in your browser to view the Mocha test runner. The `gulp test` task will start a static Connect file server and re-build the main and test files when any of their sources are edited (e.g. the `build/bundle.js` and `test/bundle-test.js` files will be re-built on save).

Thanks to Browserify, the tests are using `require()` to import the library files, including `utils.js`. The following task will build the test bundle used in the test runner HTML file:

	gulp build-test

This is automatically called in `gulp test`.

Tests run in a browser window for now, since headless browsers like PhantomJS don't support the `IndexedDB` API yet (as of PhantomJS 1.9).

## License

MIT.
