const { series, parallel, src, dest } = require('gulp')

function clean(cb) {
    cb();
}

function build(cb) {
    cb();
}

function copyJQuery(cb) {
    return src('node_modules/jquery/dist/jquery.{min.js,js,slim.min.js,slim.js}')
        .pipe(dest('wwwroot/lib/js'));
}

function copyBootstrap(cb) {
    return src('node_modules/bootstrap/dist/**/bootstrap.{min.css,css,bundle.min.js,bundle.js}')
        .pipe(dest('wwwroot/lib'));
}

function copyPopper(cb) {
    cb();
}

exports['build'] = build;
exports['clean'] = clean;
exports['copy-lib'] = parallel(copyJQuery, copyBootstrap, copyPopper);
exports['default'] = series(clean, build);

