const { series, parallel, src, dest } = require('gulp')

function copyJQuery(cb) {
    return src('node_modules/jquery/dist/jquery.{min.js,js,slim.min.js,slim.js}')
        .pipe(dest('wwwroot/lib/js'));
}

function copyJQueryBase64(cb) {
    return src('node_modules/jquery-base64/jquery.base64.{min.js,js}')
        .pipe(dest('wwwroot/lib/js'));
}

function copyBootstrap(cb) {
    return src('node_modules/bootstrap/dist/**/bootstrap.{min.css,css,bundle.min.js,bundle.js,bundle.js.map}')
        .pipe(dest('wwwroot/lib'));
}

function copyFontAwesome(cb) {
    return src('node_modules/font-awesome/{css,fonts}/*.{css,eot,svg,ttf,woff,woff2,otf}')
        .pipe(dest('wwwroot/lib'));
}

exports['copy-lib'] = parallel(copyJQuery, copyBootstrap, copyJQueryBase64, copyFontAwesome);
exports['default'] = exports['copy-lib']
