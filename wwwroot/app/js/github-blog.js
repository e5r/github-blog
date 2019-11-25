// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

+function ($, exports) {
    "use strict";

    /* Engine
    ---------------------------------------------------------------------- */
    var __storage__ = window.localStorage
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

        SETUP_TIMEOUT = 30 * 1000, // 30 seconds

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
            ready();
        };
    }

    function failTask(taskName, reason) {
        console.error('Task', taskName, 'fail!\n-> reason:', reason || 'not identified.');
        clearTimeout(timeoutHandler);
    }

    function ready() {
        console.log("Ready!");
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

    /**
     * DataTree
     */
    function DataTree() {
        if (!(this instanceof DataTree)) {
            return new DataTree();
        }

        this.__root__ = {
            type: 'directory',
            name: '/',
            childs: []
        };
    }

    /**
     * Create a directory node
     */
    DataTree.prototype.mkdir = function (path) {
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
     * Create a file node
     */
    DataTree.prototype.createFile = function (path, fileUrl) {
        var parent = this.__root__.childs,
            directories = (path || '').split('/'),
            fileName = directories.splice(directories.length - 1)[0];

        for (var d = 0; d < directories.length; d++) {
            var dir = directories[d];

            if (!parent.filter(function (v) { return v.name === dir }).length) {
                failTask('DataTree.prototype.createFile', 'Parent directory not exists!');
                return false;
            }

            parent = parent.filter(function (v) { return v.name === dir })[0].childs;
        };

        if (parent.filter(function (v) { return v.name === fileName }).length) {
            failTask('DataTree.prototype.createFile', 'File "' + fileName + '" already exists!');

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
            + '?recursive=1',

            TASKS_REQUIRED = [
                "start-params",
                "load-raw-data",
                "make-tree",
                "validate-tree"
            ];

        ensureParam('api.raw.url', API_RAW_URL);
        ensureParam('tasks.required', TASKS_REQUIRED);
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
        var tree = new DataTree();

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
                if (!tree.mkdir(node.path)) return;
            }
            else if (node.type === 'blob') {
                if (!tree.createFile(node.path, node.url)) return;
            }
        };

        saveParam('data.fs.state', tree);
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

        var DATA_FS_STATE = ensureParam('data.fs.state', {});

        if (!DATA_FS_STATE || typeof DATA_FS_STATE !== 'object') {
            failTask(TASK_NAME, 'Invalid DATA_FS');
            return;
        }

        //done();

        function done() {
            !TASKS_STATUS[TASK_NAME] && doneTask(TASK_NAME);
            // TODO: next

            // A última tarefa sempre conclui. Isso garante a chamada a ready()
            doneTask(TASK_NAME);
        }
    }

    exports.GitHubBlog = {
        init: function (options) {
            timeoutHandler = setTimeout(timeoutTask, SETUP_TIMEOUT);
            startParamsTask(options);
        }
    };

}(jQuery, window);
