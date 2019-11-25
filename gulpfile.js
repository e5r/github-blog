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

function copyJQueryBase64(cb) {
    return src('node_modules/jquery-base64/jquery.base64.{min.js,js}')
        .pipe(dest('wwwroot/lib/js'));
}

function copyBootstrap(cb) {
    return src('node_modules/bootstrap/dist/**/bootstrap.{min.css,css,bundle.min.js,bundle.js}')
        .pipe(dest('wwwroot/lib'));
}

exports['build'] = build;
exports['clean'] = clean;
exports['copy-lib'] = parallel(copyJQuery, copyBootstrap, copyJQueryBase64);
exports['default'] = series(clean, build);

