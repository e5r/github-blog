// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

+function ($, GHB) {
    "use strict";

    $(document).ready(function () {
        var body = $('body'),
            options = {
                owner: body.data('github-owner'),
                repository: body.data('github-repository'),
                branch: body.data('github-branch') || 'master'
            };

        GHB.init(options);
    });

}(jQuery, window.GitHubBlog);
