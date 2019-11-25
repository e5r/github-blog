// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

+function ($, gitHubBlog) {
    "use strict";

    function themeStartup(metadata) {
        console.log('Metadados carregados. Inicializando o tema!', metadata);
    }

    function installTheme() {
        gitHubBlog.themeEngine = {
            startup: themeStartup
        };
    }

    installTheme();

}(jQuery, window.GitHubBlog);
