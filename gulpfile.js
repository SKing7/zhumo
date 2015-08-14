'use strict';

var gulp    = require('gulp'),
    path    = require('path'),
    open    = require('open'),
    chalk   = require('chalk');

var plugins = require('gulp-load-plugins')();

// source files that need process
var paths = {
    clientJs: ['public/js/**/*.js'],
    clientCss: ['public/css/**/*.css'],
    serverJs: ['server.js', 'app', 'config'],
    serverView: ['app/views'],
};

function openInBrowser (timeout) {
    setTimeout(function () {
        open('http://localhost:8990');
    }, timeout || 1000);
}

/**
 * development task
 */
gulp.task('dev', ['watch'], function () {
    // start express server by supervisor
    plugins.supervisor('server.js', {
        watch: paths.serverJs.concat(paths.serverView),
        ignore: [],
        extensions: ['js', 'hbs']
    });

    openInBrowser();
});

/**
 * TODO build task
 */

/**
 * watch file change
 */
gulp.task('watch', function() {
    var livereload, files;

    // start livereload server
    livereload = plugins.livereload();

    // livereload on client files
    files = paths.clientCss.concat(paths.clientJs);
    gulp.watch(files).on('change', function(file) {
        console.log(chalk.bgBlue('RELOAD CLIENT FILE: ' + file.path.replace(__dirname, '')));
        livereload.changed(file.path);
    });

    // livereload on server scripts
    files = paths.serverJs.concat(paths.serverView);
    gulp.watch(files).on('change', function(file) {
        console.log(chalk.bgBlue('RELOAD SERVER FILE: ' + file.path.replace(__dirname, '')));
        setTimeout(function () { // REQUIRED
            livereload.changed(file.path);
        }, 2000);
    });

    // jslint on scripts
    gulp.watch(paths.clientJs).on('change', function (file) {
        gulp.src(file.path)                                    // Read .js files
            .pipe(plugins.jshint('.jshintrc'))                  // Lint .js files //.pipe(jshint('.jshintrc'))
            .pipe(plugins.jshint.reporter('jshint-stylish'))    // Specify a reporter for JSHint
            .pipe(plugins.notify({ onLast: true, message: 'Lint task complete' }));
    });

    // csslint on styles
    gulp.watch(paths.clientCss).on('change', function (file) {
        gulp.src(file.path)
            .pipe(plugins.csslint('.csslintrc'))
            .pipe(plugins.csslint.reporter());
    });

});

