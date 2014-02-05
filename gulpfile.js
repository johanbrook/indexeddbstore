var gulp = 			require('gulp');
var gutil = 		require('gulp-util');
var browserify = 	require('gulp-browserify');
var watch = 		require("gulp-watch");
var clean = 		require('gulp-clean');
var concat = 		require("gulp-concat");
var spawn = 		require('child_process').spawn;

// Common build operation:
// 	Take IndexedDBStore, add deps, concatenate into
// 	`bundle.js` and put in build directory.
function build() {
	gulp.src('./lib/IndexedDBStore.js')
		.pipe(browserify())
		.pipe(concat("bundle.js"))
		.pipe(gulp.dest("./build"));
}


// Default task: build
gulp.task('default', ['build'], function(){

});

gulp.task('test', ['build'], function () {
	// Use browser based testing and not a headless WebKit
	// proxy, since PhantomJS doesn't support IndexedDB as 
	// of 1.9.x.
    spawn("open", ["test/runner.html"]);
});

// Watch source files and use Browserify to handle deps.
gulp.task('watch', function() {
	gulp.src("lib/**/*.js").pipe(watch(function(files) {
		return build();
	}));
});

gulp.task('build', ['clean'], function() {
    build();
});

gulp.task('clean', function() {
	gulp.src('./build', {read: false}).pipe(clean());
});
