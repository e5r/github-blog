// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

+function ($, gitHubBlog) {
    "use strict";

    $(document).ready(function () {
        var body = $('body'),
            options = {
                owner: body.data('github-owner'),
                repository: body.data('github-repository'),
                branch: body.data('github-branch') || 'master'
            };

        gitHubBlog.init(options);
    });

}(jQuery, window.GithubBlog);
