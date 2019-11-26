// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

+function ($, exports) {
    "use strict";

    /* Engine
    ---------------------------------------------------------------------- */
    var __startup__ = function () { },
        __themeEngine__ = new ThemeEngine(),
        __router__ = new Router(),
        __storage__ = window.localStorage
            ? window.localStorage
            : (function localStorageFallback() {
                if (!(this instanceof localStorageFallback)) {
                    return new localStorageFallback();
                }

                var self = this;

                self.__data__ = {};

                self.setItem = function (name, value) {
                    self.__data__[name] = value;
                }

                self.getItem = function (name) {
                    return self.__data__[name];
                }

                self.removeItem = function (name) {
                    delete self.__data__[name];
                }

                self.clear = function () {
                    self.__data__ = {};
                }
            })(),

        decodeBase64 = true &&
            typeof window.decodeURIComponent === 'function' &&
            typeof window.escape === 'function' &&
            typeof window.atob === 'function'
            ? function NativeBase64Decode(str) {
                return window.decodeURIComponent(window.escape(window.atob(str)));
            }
            : true &&
                typeof $ === 'function' &&
                typeof $.base64 === 'object' &&
                typeof $.base64.decode
                ? function JQueryBase64Decode(str) {
                    return $.base64.decode(str);
                }
                : function NoBase64DecodeDetected(str) {
                    return str;
                },

        SETUP_TIMEOUT = 10 * 1000, // 10 seconds

        ALL_TASKS = [
            "start-params",
            "load-raw-data",
            "make-tree",
            "validate-tree",
            "load-metadata"
        ],

        timeoutHandler = null;

    function doneTask(taskName) {
        var TASKS_REQUIRED = ensureParam('tasks.required', []),
            TASKS_STATUS = ensureParam('tasks.status', {});

        TASKS_STATUS[taskName] = true;
        saveParam('tasks.status', TASKS_STATUS);

        if (TASKS_REQUIRED.length === TASKS_REQUIRED.reduce(function (first, task) {
            var total = Number.isInteger(first) ? first : 0;

            if (typeof first === 'string')
                total += TASKS_STATUS[first] ? 1 : 0;

            total += TASKS_STATUS[task] ? 1 : 0;

            return total;
        })) {
            clearTimeout(timeoutHandler);
            ready(ensureParam('blog.metadata', {}));
        };
    }

    function failTask(taskName, reason) {
        console.error('Task', taskName, 'fail!\n-> reason:', reason || 'not identified.');
        clearTimeout(timeoutHandler);
    }

    function ready(metadata) {
        __startup__(metadata.blog);
    }

    function timeoutTask() {
        failTask('timeoutTask', 'timeout');
    }

    function loadParam(param) {
        var paramValue = __storage__[param];

        if (paramValue)
            return JSON.parse(paramValue);
    }

    function saveParam(param, value) {
        __storage__[param] = value
            ? JSON.stringify(value)
            : null;
    }

    function ensureParam(param, value) {
        if (!loadParam(param))
            saveParam(param, value);

        return loadParam(param);
    }

    function ensureCacheFs(taskName) {
        var DATA_FS_CACHE = ensureParam('data.fs.cache', {});

        if (!DATA_FS_CACHE || typeof DATA_FS_CACHE.__root__ !== 'object') {
            failTask(taskName, 'Invalid DATA_FS_CACHE');
            return;
        }

        return new CacheFileSystem(DATA_FS_CACHE);
    }

    /**
     * CacheFileSystem
     */
    function CacheFileSystem(rootNode) {
        if (!(this instanceof CacheFileSystem)) {
            return new CacheFileSystem(rootNode);
        }

        this.__root__ = rootNode && rootNode.__root__
            ? rootNode.__root__
            : {
                type: 'directory',
                name: '/',
                childs: []
            };
    }

    /**
     * Directory exists
     */
    CacheFileSystem.prototype.directoryExists = function (path) {
        var parent = this.__root__.childs,
            all = (path || '').split('/');

        for (var e = 0; e < all.length; e++) {
            var entry = all[e];

            if (!parent.filter(function (v) { return v.name === entry && v.type === "directory" }).length)
                return false;

            parent = parent.filter(function (v) { return v.name === entry && v.type === "directory" })[0].childs;
        };

        return true;
    }

    /**
     * Create a directory node
     */
    CacheFileSystem.prototype.mkdir = function (path) {
        var node = this.__root__.childs,
            all = (path || '').split('/');

        for (var d = 0; d < all.length; d++) {
            var dir = all[d];
            if (!node.filter(function (v) { return v.name === dir }).length) {
                node.push({
                    type: 'directory',
                    name: dir,
                    childs: []
                })
            }

            node = node.filter(function (v) { return v.name === dir })[0].childs;
        };

        return true;
    }

    /**
     * File exists
     */
    CacheFileSystem.prototype.fileExists = function (path) {
        var parent = this.__root__.childs,
            directories = (path || '').split('/'),
            fileName = directories.splice(directories.length - 1)[0];

        for (var d = 0; d < directories.length; d++) {
            var dir = directories[d];

            if (!parent.filter(function (v) { return v.name === dir && v.type === "directory" }).length)
                return false;

            parent = parent.filter(function (v) { return v.name === dir && v.type === "directory" })[0].childs;
        };

        return parent.filter(function (v) { return v.name === fileName && v.type === "file" }).length;
    }

    /**
     * Create a file node
     */
    CacheFileSystem.prototype.createFile = function (path, fileUrl) {
        var parent = this.__root__.childs,
            directories = (path || '').split('/'),
            fileName = directories.splice(directories.length - 1)[0];

        for (var d = 0; d < directories.length; d++) {
            var dir = directories[d];

            if (!parent.filter(function (v) { return v.name === dir && v.type === "directory" }).length) {
                failTask('CacheFileSystem.prototype.createFile', 'Parent directory not exists!');
                return false;
            }

            parent = parent.filter(function (v) { return v.name === dir && v.type === "directory" })[0].childs;
        };

        if (parent.filter(function (v) { return v.name === fileName }).length) {
            failTask('CacheFileSystem.prototype.createFile', 'File "' + fileName + '" already exists!');

            return false;
        }

        parent.push({
            type: 'file',
            name: fileName,
            content: null,
            url: fileUrl
        });

        return true;
    }

    /**
     * Read file content
     */
    CacheFileSystem.prototype.readFile = function (path, done) {
        var self = this,
            done = done || function () { },
            parent = self.__root__.childs,
            directories = (path || '').split('/'),
            fileName = directories.splice(directories.length - 1)[0];

        for (var d = 0; d < directories.length; d++) {
            var dir = directories[d];

            if (!parent.filter(function (v) { return v.name === dir && v.type === "directory" }).length) {
                done('File "' + path + '" not found!');
                return;
            }

            parent = parent.filter(function (v) { return v.name === dir && v.type === "directory" })[0].childs;
        };

        var files = parent.filter(function (v) { return v.name === fileName && v.type === "file" });

        if (!files.length) {
            done('File "' + path + '" not found!');
            return;
        }

        var fileEntry = files[0];

        if (fileEntry.content) {
            done(null, fileEntry.content);
            return;
        }

        $.getJSON(fileEntry.url)
            .done(function (data, status, config) {
                if (!data || typeof data.content !== 'string') {
                    done('Invalid file data!');
                    return;
                }

                var fileContent = data.content;

                if (data.encoding === 'base64') {
                    var linearData = fileContent.replace(/\n/g, '');
                    fileContent = decodeBase64(linearData);
                }

                fileEntry.content = fileContent;

                saveParam('data.fs.cache', self);

                done(null, fileContent);
            })
            .fail(function (config, error, reason) {
                done(reason || config.responseText || 'Error on get "' + fileEntry.url + '"');
            });
    }

    /* Tasks
    ---------------------------------------------------------------------- */
    function startParamsTask(config) {
        var TASK_NAME = "start-params",
            TASKS_STATUS = ensureParam('tasks.status', {});

        if (TASKS_STATUS[TASK_NAME]) {
            done();
            return;
        }

        var API_RAW_URL = 'https://api.github.com/repos/'
            + config.owner + '/'
            + config.repository
            + '/git/trees/'
            + (config.branch || 'master')
            + '?recursive=1';

        ensureParam('api.raw.url', API_RAW_URL);
        ensureParam('tasks.required', ALL_TASKS);
        done();

        function done() {
            !TASKS_STATUS[TASK_NAME] && doneTask(TASK_NAME);
            loadRawDataTask();
        }
    }

    function loadRawDataTask() {
        var TASK_NAME = "load-raw-data",
            TASKS_STATUS = ensureParam('tasks.status', {});

        if (TASKS_STATUS[TASK_NAME]) {
            done();
            return;
        }

        var API_RAW_URL = loadParam('api.raw.url');

        $.getJSON(API_RAW_URL)
            .done(function (data, status, config) {
                saveParam('data.raw', data);
                done();
            })
            .fail(function (config, error, reason) {
                failTask(TASK_NAME, reason, config);
            });

        function done() {
            !TASKS_STATUS[TASK_NAME] && doneTask(TASK_NAME);
            makeTreeTask();
        }
    }

    function makeTreeTask() {
        var TASK_NAME = "make-tree",
            TASKS_STATUS = ensureParam('tasks.status', {});

        if (TASKS_STATUS[TASK_NAME]) {
            done();
            return;
        }

        var DATA_RAW = ensureParam('data.raw', {});
        var cacheFs = new CacheFileSystem();

        if (!DATA_RAW || !Array.isArray(DATA_RAW.tree)) {
            failTask(TASK_NAME, 'Invalid DATA_RAW');
            return;
        }

        for (var n = 0; n < DATA_RAW.tree.length; n++) {
            var node = DATA_RAW.tree[n];

            if (!node ||
                typeof node.path !== 'string' ||
                typeof node.sha !== 'string' ||
                typeof node.url !== 'string' ||
                typeof node.type !== 'string') {

                failTask(TASK_NAME, 'Invalid DATA_RAW.tree[' + n + ']');
                return;
            }

            if (node.type === 'tree') {
                if (!cacheFs.mkdir(node.path)) return;
            }
            else if (node.type === 'blob') {
                if (!cacheFs.createFile(node.path, node.url)) return;
            }
        };

        saveParam('data.fs.cache', cacheFs);
        done();

        function done() {
            !TASKS_STATUS[TASK_NAME] && doneTask(TASK_NAME);
            validateTreeTask();
        }
    }

    function validateTreeTask() {
        var TASK_NAME = "validate-tree",
            TASKS_STATUS = ensureParam('tasks.status', {});

        if (TASKS_STATUS[TASK_NAME]) {
            done();
            return;
        }

        var cacheFs = ensureCacheFs(TASK_NAME);

        if (!cacheFs) return;

        if (!cacheFs.directoryExists('blog')) {
            failTask(TASK_NAME, 'Directory "/blog" not found!');
            return;
        }

        if (!cacheFs.fileExists('blog/meta.json')) {
            failTask(TASK_NAME, 'File "/blog/meta.json" not found!');
            return;
        }

        if (!cacheFs.directoryExists('blog/posts')) {
            failTask(TASK_NAME, 'Directory "/blog/posts" not found!');
            return;
        }

        done();

        function done() {
            !TASKS_STATUS[TASK_NAME] && doneTask(TASK_NAME);
            loadMetaDataTask();
        }
    }

    function loadMetaDataTask() {
        var TASK_NAME = "load-metadata",
            TASKS_STATUS = ensureParam('tasks.status', {});

        if (TASKS_STATUS[TASK_NAME]) {
            done();
            return;
        }

        var cacheFs = ensureCacheFs(TASK_NAME);

        if (!cacheFs) return;

        cacheFs.readFile('blog/meta.json', function (error, fileData) {
            if (error)
                failTask(TASK_NAME, error);

            var metadata = JSON.parse(fileData || '{}');

            if (!metadata || typeof metadata.blog !== 'object' || !Array.isArray(metadata.posts)) {
                failTask(TASK_NAME, 'Invalid meta.json content!');
                return;
            }

            saveParam('blog.metadata', metadata);
            done();
        });

        function done() {
            // A última tarefa sempre conclui independente de já ter sido concluída antes.
            // Isso garante a chamada a ready()
            doneTask(TASK_NAME);
        }
    }

    /* Theme engine
    ---------------------------------------------------------------------- */
    function ThemeEngine() {
        if (!(this instanceof ThemeEngine)) {
            return new ThemeEngine();
        }

        this.__templates__ = [];
    };

    ThemeEngine.prototype.getTemplate = function (templateId) {
        var self = this,
            cached = self.__templates__.filter(function (v) { return v.id === templateId });

        if (cached.length)
            return cached[0].element.clone();

        var templateContent = $('script[type="text/template"][data-template-id="' + templateId + '"]').html();

        if (templateContent) {
            var templateItem = {
                id: templateId,
                element: $(templateContent)
            };

            self.__templates__.push(templateItem);

            return templateItem.element.clone();
        }
    }

    ThemeEngine.prototype.getAllCategories = function () {
        var metadata = ensureParam('blog.metadata', {}),
            posts = Array.isArray(metadata.posts) ? metadata.posts : [],
            categories = posts.reduce(function (first, second) {
                var calculated = Array.isArray(first)
                    ? first
                    : [];

                if (!Array.isArray(first) && Array.isArray(first.categories))
                    calculated = calculated.concat(first.categories)

                if (Array.isArray(second.categories))
                    calculated = calculated.concat(second.categories)

                return calculated;
            });

        return categories.sort();
    }

    /* Router
    ---------------------------------------------------------------------- */
    function Router() {
        if (!(this instanceof Router)) {
            return new Router();
        }

        this.__routes__ = [];
        this.__defaultRoute__ = "";
        this.__notFoundHandler__ = function silentNotFoundHandler() { };
        this.__ignited__ = false;
    }

    Router.prototype.when = function (path, handler) {
        if (typeof path !== 'string')
            throw 'Param @path must be a string';

        if (typeof handler !== 'function')
            throw 'Param @handler must be a function';

        var self = this,
            record = self.__routes__.filter(function (r) { return r.path === path })[0];

        if (!record) {
            record = {
                path: path,
                handler: handler
            };

            self.__routes__.push(record);
        }

        return this;
    };

    Router.prototype.notFound = function (handler) {
        if (typeof handler !== 'function')
            throw 'Param @handler must be a function';

        this.__notFoundHandler__ = handler;

        return this;
    }

    Router.prototype.otherwise = function (path) {
        if (typeof path !== 'string')
            throw 'Param @path must be a string';

        this.__defaultRoute__ = path;

        return this;
    }

    Router.prototype.findRouteHandler = function (path) {
        var self = this,
            record = self.__routes__.filter(function (r) { return r.path === path })[0]
                || path === '/'
                ? self.__routes__.filter(function (r) { return r.path === self.__defaultRoute__ })[0]
                : { handler: self.__notFoundHandler__ };

        return record.handler;
    }

    Router.prototype.ignite = function (oldPath) {
        var self = this;

        self.__ignited__ || window.addEventListener('hashchange', function (event) {
            var url = document.createElement('a');
            url.href = event.oldURL;
            self.ignite(url.hash);
        });

        var hashUrl = location.hash || '/';

        if (hashUrl.length && hashUrl.charAt(0) === '#')
            hashUrl = hashUrl.substring(1);

        function RouterParam() { };

        var parts = hashUrl.split('?'),
            path = parts[0],
            params = (parts[1] || '')
                .split('&')
                .map(function (param) {
                    var pair = (param || '').split('=');

                    return { key: pair[0], value: pair[1] || true }
                })
                .filter(function (v) { return v.key })
                .reduce(function (result, item) {
                    if (item && item.key) {
                        result[item.key] = typeof item.value === 'string' && item.value.indexOf('%') >= 0
                            ? decodeURIComponent(item.value)
                            : item.value;

                        try {
                            result[item.key] = JSON.parse(result[item.key]);
                        }
                        catch{ }
                    }

                    return result;
                }, {});

        console.log('url:', hashUrl);
        console.log('-parts:', parts);
        console.log('-path:', path);
        console.log('-params:', params);
        console.log('-route:', self.findRouteHandler(path));
    }

    /* Exports
    ---------------------------------------------------------------------- */
    exports.GitHubBlog = {
        themeEngine: function () { return __themeEngine__; },
        router: function () { return __router__; },
        init: function (options) {
            timeoutHandler = setTimeout(timeoutTask, SETUP_TIMEOUT);
            startParamsTask(options);
        },
        themeStartup: function (handler) {
            if (typeof handler !== 'function') return;
            __startup__ = handler;
        }
    };

}(jQuery, window);
