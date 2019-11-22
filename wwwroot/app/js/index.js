// Copyright (c) E5R Development Team. All rights reserved.
// Licensed under the Apache License, Version 2.0. More license information in LICENSE.txt.

+function ($, args) {
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

        TIMEOUT = 30 * 1000, // 30 seconds

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
            ready()
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
                "make-tree"
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

        // TODO: Not implemented!
        console.log('DATA_RAW:', DATA_RAW);

        done();

        function done() {
            !TASKS_STATUS[TASK_NAME] && doneTask(TASK_NAME);
            // TODO: next

            // A última tarefa sempre conclui. Isso garante a chamada a ready()
            doneTask(TASK_NAME);
        }
    }

    /* Main
    ---------------------------------------------------------------------- */
    (function main() {
        timeoutHandler = setTimeout(timeoutTask, TIMEOUT);

        startParamsTask(args);
    })();

}(jQuery, {
    owner: 'e5r',
    repository: 'bit',
    branch: 'develop'
});
