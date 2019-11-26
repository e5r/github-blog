// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

+function ($, gitHubBlog) {
    "use strict";

    var engine = gitHubBlog.themeEngine;

    function themeStartup(blogInfo) {
        applyBlogInfo(blogInfo || {});
        showBlog();
        route();
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

            link.attr('href', 'http://erlimar.com')
                .attr('target', '_blank')
                .text(category);

            item.appendTo(categoriesEl);
        });
    }

    function showBlog() {
        $('header,main,footer').removeClass('d-none');
        $('body').removeClass('app-loading');
    }

    function installTheme() {
        gitHubBlog.themeEngine = {
            startup: themeStartup
        };
    }

    function route() {
        var template = engine.getTemplate('home-posts');
    }

    installTheme();

}(jQuery, window.GitHubBlog);
