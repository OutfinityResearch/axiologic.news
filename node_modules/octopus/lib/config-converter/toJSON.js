const utils = require('./utils');

/**
 * Converts from .octopus in octopus.json
 * */
module.exports = rawConfig => {
    const config = {
        workDir: '.',
        dependencies: []
    };

    const context = {
        scope: 'global',
        history: [],
        tasks: { dependencies: {} },
        active: {
            task: 'dependencies'
        },
        update: (scope) => {
            context.history.push(context.scope);
            context.scope = scope;
        }
    };


    function parseConfig(rawConfig) {
        const file = rawConfig.split(/\r?\n/);

        for (const line of file) {
            parseLine(line);
        }

        saveFromContext();
        return { config, context };
    }

    function parseLine(rawLine) {
        if (!rawLine) {
            return;
        }

        switch (context.scope) {
            case 'global': {
                parseKeyword(rawLine);
                break;
            }

            case 'workDir': {
                fillWorkDir(rawLine);
                break;
            }

            case 'dependency': {
                fillDependency(rawLine);
                break;
            }

            case 'task': {
                fillTask(rawLine)
                break;
            }
        }
    }

    function parseKeyword(rawLine) {
        if (!rawLine) {
            return false;
        }

        // a new command will come
        const [type, rest] = utils.splitLine(rawLine);

        switch (type) {
            case 'workDir': {
                initWorkDir(rest);
                return false;
            }
            case 'dependency': {
                initDependency(rest);
                return false;
            }
            case 'task': {
                initTask(rest);
                return false;
            }
        }

        return true;
    }


    function saveFromContext() {
        context.history.push(context.scope);
        delete context.scope;
        delete context.active;
        delete context.update;

        for (let [category, task] of Object.entries(context.tasks)) {
            if (!config[category]) {
                config[category] = [];
            }
            for (let [_, dependency] of Object.entries(task)) {
                config[category].push(dependency);
            }
        }

        delete context.tasks;
    }


    // workDir "<path>"
    function initWorkDir(rawLine) {
        context.update('workDir');
        fillWorkDir(rawLine);
    }

    function fillWorkDir(rawLine) {
        if (!rawLine) {
            return;
        }

        const [workDir, rest] = utils.substrParam(rawLine);
        config.workDir = workDir;
        context.update('global');

        parseLine(rest);
    }

    // dependency "<name>"
    function initDependency(rawLine) {
        if (!rawLine) {
            return;
        }

        const [dependency, rest] = utils.substrParam(rawLine);

        context.active.dependency = dependency;
        context.tasks[context.active.task][context.active.dependency] = {
            name: dependency,
            actions: []
        };

        context.update('dependency');

        fillDependency(rest);
    }

    function fillDependency(rawLine) {
        if (!parseKeyword(rawLine)) {
            return;
        }

        const { found, args } = utils.substrArgs(rawLine);
        if (!found) {
            return;
        }

        const { task, dependency } = context.active;
        const [completion, ...active] = args;
        const index = context.tasks[task][dependency].actions.length - 1;

        if (!context.tasks[task][dependency].actions[index]) {
            let copy = { ...context.tasks[task][dependency] };
            delete copy.actions;
            context.tasks[task][dependency] = {
                name: context.tasks[task][dependency].name,
                ...copy,
                ...completion,
                actions: context.tasks[task][dependency].actions
            }
        }
        else if (Object.keys(completion).length) {
            context.tasks[task][dependency].actions[index] = utils.mergeDeep(
                context.tasks[task][dependency].actions[index],
                completion
            );
        }

        if (Object.keys(active).length) {
            context.tasks[task][dependency].actions.push(...active);
        }
    }

    // task "<name>"
    function initTask(rawLine) {
        if (!rawLine) return;

        const [task, rest] = utils.substrParam(rawLine);
        context.active.task = task;
        context.tasks[context.active.task] = {};
        context.update('task');

        return parseLine(rest);
    }

    function fillTask(rawLine) {
        parseKeyword(rawLine);
    }


    return parseConfig(rawConfig);
}