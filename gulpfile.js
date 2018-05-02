var gulp = require('gulp'),
    mocha = require('gulp-mocha'),
    node;
var paths = {
    srclodash: 'node_modules/lodash/lodash.js',
    srcrevalidator: 'node_modules/revalidator/lib/revalidator.js',
    srcq: 'node_modules/q/q.js',
    srcmoment: 'node_modules/moment/moment.js',
    distlibHTTPTrigger: 'HttpTriggerJS1/lib',
    distlibTimerTrigger: 'TimerTriggerJS1/lib'
};

gulp.task('copy_lodash', function () {
    return gulp.src(paths.srclodash)
        .pipe(gulp.dest(paths.distlibHTTPTrigger));
});
gulp.task('copy_revalidator', function () {
    return gulp.src(paths.srcrevalidator)
        .pipe(gulp.dest(paths.distlibHTTPTrigger));
});
gulp.task('copy_q', function () {
    return gulp.src(paths.srcq)
        .pipe(gulp.dest(paths.distlibHTTPTrigger))
        .pipe(gulp.dest(paths.distlibTimerTrigger));
});
gulp.task('copy_moment', function () {
    return gulp.src(paths.srcmoment)
        .pipe(gulp.dest(paths.distlibHTTPTrigger));
});

gulp.task('deploy_node_modules', ['copy_lodash', 'copy_revalidator', 'copy_q', 'copy_moment']);

gulp.task('test', function () {
    gulp.src('test/**/*.js')
        .pipe(mocha({
            reporter: 'spec',
            clearRequireCache: true,
            ignoreLeaks: true
        }));
});

// clean up if an error goes unhandled.
process.on('exit', function() {
    if (node) node.kill()
});


