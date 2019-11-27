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

    function formatDateTime(datetime) {
        if (!(datetime instanceof Date))
            return datetime;

        var years = datetime.getFullYear().toString(),
            months = datetime.getMonth().toString(),
            days = datetime.getDate().toString(),
            hours = datetime.getHours().toString(),
            minutes = datetime.getMinutes().toString(),
            seconds = datetime.getSeconds().toString();

        return '0'.repeat(2 - days.length) + days + '/' +
            '0'.repeat(2 - months.length) + months + '/' +
            '0'.repeat(4 - years.length) + years + ' ' +
            '0'.repeat(2 - hours.length) + hours + ':' +
            '0'.repeat(2 - minutes.length) + minutes + ':' +
            '0'.repeat(2 - seconds.length) + seconds;
    }

    /* Main
    ---------------------------------------------------------------------- */
    (function main() {
        gitHubBlog.themeStartup(themeStartup);

        // "/home" -> Home page
        router.when('/home', function homePage(context, done) {
            var template = engine.getTemplate('home-page'),
                postsContainer = $('[data-id="posts-container"]', template),
                postTemplate = $('[data-id="post"]', template);

            postsContainer.empty();

            (engine.getHomePosts() || []).forEach(function (post) {
                var postEl = postTemplate.clone(),
                    bannerEl = $('img', postEl);

                if (post.bannerUrl)
                    bannerEl.attr('src', post.bannerUrl)
                else
                    bannerEl.remove();

                $('h3', postEl).text(post.title);
                $('p', postEl).text(post.abstract);
                $('a', postEl).attr('href', '#/post/' + post.id);
                $('small', postEl).text(post.nativeDatetime ? formatDateTime(post.nativeDatetime) : post.datetime);

                postsContainer.append(postEl);
            })

            done(router.view(template))
        });

        // "/post/{postId}" -> View post
        router.when('/post/:postId', function viewPostPage(context, done) {
            engine.getPostContent(context.params.postId, function (postContent) {
                if (postContent) {
                    var template = engine.getTemplate('post-page'),
                        content = $(typeof postContent === 'string' ? '<div>' + postContent + '</div>' : postContent);

                    $('pre', content).addClass('card p-2 shadow rounded');

                    $('[data-id="post-container"]', template)
                        .empty()
                        .append(content);

                    done(router.view(template));
                } else {
                    var template = engine.getTemplate('not-found-post');

                    $('[data-id="post-id"]', template).text(context.params.postId);

                    done(router.view(template));
                }
            });
        });

        // "*" -> Not found page
        router.notFound(function notFoundPage(path, context, done) {
            var template = engine.getTemplate('not-found-page');

            done(router.view(template))
        });

        // "/" Default route
        router.otherwise('/home');

        // Outlet DOM selector
        router.outletSelector('[data-id="router-outlet"');
    })();

}(jQuery, window.GitHubBlog);
