var connect = 		require('connect');
var gulp = 			require('gulp');
var gutil = 		require('gulp-util');
var browserify = 	require('gulp-browserify');
var watch = 		require("gulp-watch");
var clean = 		require('gulp-clean');
var concat = 		require("gulp-concat");
var spawn = 		require('child_process').spawn;
var notify = 		require("gulp-notify");

// Common build operation

function build(input, output, dir) {
	var src = (input === undefined) ? gulp.src('./lib/IndexedDBStore.js') :
		(typeof input === "string") ? gulp.src(input) : input;

	src
		.pipe(browserify())
		.on('error', notify.onError("<%= error.message%>"))
		.pipe(concat(output || "bundle.js"))
		.pipe(gulp.dest(dir || "./build"));
}


// Default task: build
gulp.task('default', ['build'], function(){});

gulp.task('build', ['clean'], build);

gulp.task('test-build', function(){
	build("test/tests.js", "bundle-test.js", "./test");
});

gulp.task('test', ['test-build'], function () {
	var runner = "runner.html",
			port = 3000;

		gulp.src("test/tests.js", { read: false })
			.pipe(watch({name: "Tests"}, function(files) {
				return build(files, "bundle-test.js", "./test");
			}));

		// Use browser based testing and not a headless WebKit
		// proxy, since PhantomJS doesn't support IndexedDB as
		// of 1.9.
    connect.createServer(
    	connect.static(__dirname)
    ).listen(port);

    gutil.log("Test server listening on localhost:"+port+"test/"+runner);
    gutil.log("Press Ctrl+C to quit");
});

// Watch source files and use Browserify to handle deps.
gulp.task('watch', ['test'], function() {
	gulp.src("lib/**/*.js").pipe(watch({name: "Main"}, function(files) {
		build("test/tests.js", "bundle-test.js", "./test");
		return build();
	}));
});

gulp.task('clean', function() {
	gulp.src('./build', {read: false}).pipe(clean());
});
