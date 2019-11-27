// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

+function ($, gitHubBlog) {
    "use strict";

    var engine = gitHubBlog.themeEngine(),
        router = gitHubBlog.router();

    function themeStartup(blogInfo) {
        applyBlogInfo(blogInfo || {});
        showBlog();
        router.ignite();
    }

    function applyBlogInfo(blogInfo) {
        var titleEl = $('header [data-id="blog-title"]'),
            abstractEl = $('header [data-id="blog-abstract"]'),
            categoriesEl = $('header [data-id="categories"'),
            categoryItemTemplate = $('[data-id="categories-item"]', categoriesEl);

        titleEl.text(blogInfo.title);
        abstractEl.text(blogInfo.abstract);

        categoriesEl.empty();

        engine.getAllCategories().forEach(function (category) {
            var item = categoryItemTemplate.clone(),
                link = $('a', item);

            link.attr('href', '#/categoria?goto=true&name=' + category)
                .text(category);

            item.appendTo(categoriesEl);
        });
    }

    function showBlog() {
        $('header,main,footer').removeClass('d-none');
        $('body').removeClass('app-loading');
    }

    /* Main
    ---------------------------------------------------------------------- */
    (function main() {
        gitHubBlog.themeStartup(themeStartup);

        router
            .when('/home', function homePage(context, done) {
                console.log('Show page "/home"!');
                console.log('-> context:', context);
                console.log('-> done:', done);

                done();
            })
            .when('/about', function aboutPage(context, done) {
                console.log('Show page "/about"!');
                console.log('-> context:', context);
                console.log('-> done:', done);
                done();
            })
            .notFound(function notFoundPage(path, context, done) {
                var template = engine.getTemplate('not-found');

                done(router.view(template))
            })
            .otherwise('/home')
            .outletSelector('[data-id="router-outlet"');
    })();

}(jQuery, window.GitHubBlog);
