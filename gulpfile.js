var gulp = require('gulp');
var markdownDocs = require('gulp-markdown-docs');

gulp.task('markdown', function() {
    return gulp.src(['src/*.md', 'README.md'])
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

gulp.task('default', function() {
    gulp.watch(['src/*.md', 'README.md'], ['markdown']);
});