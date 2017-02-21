'use strict';
var gulp = require('gulp'),
	sass = require('gulp-sass');

gulp.task('sass', function () {
	return gulp.src(['./sass/**/*.scss'])
		.pipe(sass({outputStyles: 'expanded'}).on('error', sass.logError))
		.pipe(gulp.dest('swapi'))
});

gulp.task('watch', function (){
	gulp.watch('./sass/**/*.scss', ['sass'])
});

gulp.task('default', ['watch']);