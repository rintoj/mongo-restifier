var gulp = require('gulp');
var markdownDocs = require('gulp-markdown-docs');

gulp.task('default', function() {
    return gulp.src(['**/*.md', 'README.md'])
        .pipe(markdownDocs('index.html', {

        }))
        .pipe(gulp.dest('./documentation/'));
});

gulp.task('default', function() {
    gulp.watch(['**/*.md', 'README.md'], ['markdown']);
});