/**
 * Called by npm (using the package.json configuration) from
 *  "freeze" hook
 * npm -> package.json -> [scripts]/freeze.js
 * */

const args = process.argv;
args.splice(0, 2);

const octopus = require("./index");
let targets = ["dependencies"];

if (args.length > 0) {
    targets = args;
}

const path = require("path");
const fs = require("fs");
const child_process = require('child_process');

const {readCommitSHA, validateCommitSHA} = require("./utils");

// Ensure that we are switched to DEV configuration
//Switch to stable octopus
octopus.setConfigFileToMode(true);

let notFoundFolders = [];

/**Performs a freeze on current configuration loaded from file (octopus.json or octopus-dev.json) */
function freezeConfig(config) {

    function updateSmartCloneAction(task, action) {
        const name = action.name || task.name;
        let targetFolder = path.resolve(path.join(config.workDir, name));
        if (action.target) {
            targetFolder = path.resolve(path.join(action.target, name));
        }
        console.log(`Trying to locate target ${targetFolder} in order to save it's state.`);
        basicProcOptions = {cwd: targetFolder};

        try{
            const utils = require("./utils.js");
            targetFolder = utils.validatePath(targetFolder);
        }catch(err){
            return octopus.handleError("Path traversal detected", err);
        }
        
        if (fs.existsSync(targetFolder) && fs.readdirSync(targetFolder).length > 0) {
            //Get commit number
            try {
                let commit = readCommitSHA(targetFolder);
                if (commit) {
                    action.commit = commit;
                }
            } catch (err) {
                octopus.handleError(`Not able to perform the saving state process for target ${targetFolder}. Reason:`, err);
            }

            //validation of the commit number
            let validCommitSHA = validateCommitSHA(action.commit, targetFolder);
            if (action.commit !== validCommitSHA) {
                let initialCommit = action.commit;
                action.commit = validCommitSHA;
                console.log(`\t * Warning: Commit number was replace for the module ${targetFolder} to ${action.commit} which represents a freezed version.`);
                console.log(`\t If the replacement of the commit number isn't desired set manualy the commit number ${initialCommit}`)
            }
        } else {
            notFoundFolders.push(targetFolder);
        }
    }

    console.log(`The scanning process will be performed for the following task lists `, JSON.stringify(targets));
    targets.forEach(target => {
        let tasks = config[target];
        if (typeof tasks === "undefined") {
            return octopus.handleError(`Unable to find the task list called <${target}> in current config.`);
        }
        for (let i = 0; i < tasks.length; i++) {
            let task = tasks[i];
            if (!task.actions || !Array.isArray(task.actions) || task.actions.length === 0) {
                require("./../lib/utils/ConfigurationDefaults").setDefaultActions(task);
            }
            for (let j = 0; j < task.actions.length; j++) {
                let action = task.actions[j];
                if (action.type == 'smartClone') {
                    updateSmartCloneAction(task, action);
                }
            }
        }
    });
}

console.log(`=============================================================================================`);
console.log(` Warning: You are running the old Octopus Freeze mechanism based on SHA commit identifiers.`);
console.log(`=============================================================================================`);

let config = octopus.readConfig();
freezeConfig(config);

if (notFoundFolders.length > 0) {
    console.log(`\n===============\nOctopus was not able to locate the following paths:\n`);
    notFoundFolders.forEach(folder => console.log(folder));
    console.log(`\nIf neccessary, check the situations and run again the script.\n===============`);
}

//Switch to stable octopus
octopus.setConfigFileToMode(false);

//Save it
octopus.updateConfig(config, (err) => {
    if (err) {
        throw err;
    }

    console.log("\nConfiguration file  " + octopus.getConfigFile() + " updated.");

    console.log(`=============================================================================================`);
    console.log(` Warning: The configuration was updated with old Octopus Freeze mechanism based on SHA commit identifiers.`);
    console.log(`=============================================================================================`);
});
