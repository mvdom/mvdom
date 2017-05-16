var gulp = require('gulp');
var browserify = require('browserify');
var rename = require('gulp-rename');
var uglify  = require( 'gulp-uglify');
var source = require('vinyl-source-stream');
var fs = require('fs-extra-plus');

gulp.task('default', ['min']);


gulp.task('min', ['compile-js'], function(){
	//fs.accessSync(distFilePath);
	return gulp.src('./dist/mvdom.js')
	.pipe(uglify())
	.pipe(rename({
		suffix: '.min'
	}))		
	.pipe(gulp.dest('dist/'));
});

gulp.task('compile-js', ['clean-dist'], function () {
	return browserify({entries: ['./src/index.js'], debug: false})
		.bundle()
		.pipe(source('mvdom.js'))
		.pipe(gulp.dest('dist/'));	
});

gulp.task('clean-dist', function(){
	return fs.remove("./dist/*.*");
});

gulp.task('watch', ['compile-js'], function () {
	return gulp.watch(['./src/*.js'], ['compile-js']);
});

