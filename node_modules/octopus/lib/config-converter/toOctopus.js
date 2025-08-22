/**
 * Converts from octopus.json to .octopus
 */
module.exports = (rawConfig, options = {
    indentation: ' '.repeat(4),
    inline: true,
    afterChr: ''
}) => {
    let configOctopus = '';
    const { indentation, inline, afterChr: afterCmdStr } = options;

    function parseConfig() {
        let configJSON = {};

        try {
            configJSON = JSON.parse(JSON.stringify(rawConfig));
        } catch (error) {
            console.error(error);
        }

        for (let [key, value] of Object.entries(configJSON)) {
            switch (key) {
                case 'workDir': {
                    addWorkDir(value);
                    break;
                }
                case 'dependencies': {
                    addDependencies(value);
                    break;
                }
                default: {
                    // only task remained
                    addTask(key, value);
                }
            }
            configOctopus += afterCmdStr;
        }

        return { config: configOctopus };
    }

    function addWorkDir(workDir) {
        if (typeof workDir !== 'string') {
            return;
        }

        configOctopus += `workDir "${workDir}"\n`;
    }

    function addParams(params, options) {
        const { tabIndex } = options;
        for (let [param, value] of Object.entries(params)) {
            if (inline) {
                configOctopus += ' ';
            }
            else {
                configOctopus += '\n' + indentation.repeat(tabIndex + 2);
            }
            configOctopus += `--${param}`;
            switch (typeof value) {
                case 'boolean':
                    if (!value) {
                        configOctopus += '=false'
                    }
                    break;
                case 'string': {
                    const quotes = value.indexOf(`"`) !== -1 ? `'` : `"`;
                    configOctopus += `=${quotes}${value}${quotes}`;
                    break;
                }
                case 'number': {
                    configOctopus += `=${value}`;
                    break;
                }
                case 'object': {
                    configOctopus += `=${JSON.stringify(value)}`;
                    break;
                }
            }
        }
        configOctopus += `\n`;
    }

    function addAction(action, options) {
        configOctopus += indentation.repeat(options.tabIndex + 1) + `${action.type}`;
        delete action.type;
        addParams(action, options);
    }

    function addDependency(dependency, options) {
        const { name, actions } = dependency;
        delete dependency.name;
        delete dependency.actions;
        configOctopus += indentation.repeat(options.tabIndex) + `dependency "${name}"`;
        addParams(dependency, {
            ...options,
            tabIndex: options.tabIndex - 1
        })
        for (let action of actions) {
            addAction(action, options)
        }
    }

    function addDependencies(dependencies, options = { tabIndex: 0 }) {
        for (let dependency of dependencies) {
            addDependency(dependency, options);
        }
    }

    function addTask(taskLabel, task) {
        configOctopus += `task "${taskLabel}"\n`;
        addDependencies(task, { tabIndex: 1 });
    }

    return parseConfig();
}