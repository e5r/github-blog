// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

+function ($, gitHubBlog) {
    "use strict";

    function themeStartup(metadata) {
        console.log('Metadados carregados. Inicializando o tema!', metadata);

        applyBlogInfo(metadata.blog || {});
        showBlog();
    }

    function applyBlogInfo(blogInfo) {
        $('header [data-id="blog-title"]').text(blogInfo.title);
        $('header [data-id="blog-abstract"]').text(blogInfo.abstract);
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

    installTheme();

}(jQuery, window.GitHubBlog);
