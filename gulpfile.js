var gulp = require('gulp');
var mocha = require('gulp-spawn-mocha');
var markdownDocs = require('gulp-markdown-docs');

gulp.task('markdown', function() {
    return gulp.src(['src/**/*.md', 'README.md'])
        .pipe(markdownDocs('index.html', {
            yamlMeta: false,
            gfm: false,
            tables: true,
            breaks: true,
            pedantic: false,
            sanitize: true,
            smartLists: true,
            smartypants: true,
            layoutStylesheetUrl: './assets/md.css',
            highlightTheme: 'github'
        }))
        .pipe(gulp.dest('./documentation/'));
});

gulp.task('test', function() {
    return gulp.src('test/**/*.js')
        .pipe(mocha({
            reporter: 'spec'
        }));
});

gulp.task('default', function() {
    gulp.watch(['src/**/*.md', 'README.md'], ['markdown']);
    gulp.watch('{src,test}/**/*.js', ['test']);
});