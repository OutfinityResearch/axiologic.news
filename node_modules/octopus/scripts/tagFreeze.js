/**
 * Called by npm (using the package.json configuration) from
 *  "tag-freeze" hook
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

const utils = require("./utils");
const {
	readVersionFromPackageJSON,
	validateCommitSHA,
	ensureVersionInPackageJSON,
	readLatestTagFromRepo,
	createTag,
	commitPackageJSON,
	incrementTag,
	getCommitForTag,
	readCommitSHA,
	getCommitDate,
	getTagDate,
	checkIfAnyCommitsBetweenDates
} = utils;

// Ensure that we are switched to DEV configuration
//Switch to stable octopus
octopus.setConfigFileToMode(true);

let notFoundFolders = [];

/**Performs a freeze on current configuration loaded from file (octopus.json or octopus-dev.json) */
function freezeConfig(config) {
	return new Promise(async (resolve, reject) => {
		async function updateSmartCloneAction(task, action) {
			const name = action.name || task.name;
			let targetFolder = path.resolve(path.join(config.workDir, name));
			if (action.target) {
				targetFolder = path.resolve(path.join(action.target, name));
			}
			console.log(`Trying to determine the state of target ${targetFolder}.`);
			basicProcOptions = {cwd: targetFolder};

			try{
				const utils = require("./utils.js");
				targetFolder = utils.validatePath(targetFolder);
			}catch(err){
				return octopus.handleError("Path traversal detected", err);
			}
			
			if (fs.existsSync(targetFolder) && fs.readdirSync(targetFolder).length > 0) {
				let packageVersion;
				//read current version for package.json
				try {
					packageVersion = await readVersionFromPackageJSON(targetFolder);
					console.log(`Read package version ${packageVersion}`);
				} catch (err) {
					octopus.handleError(`Not able to perform the saving state process for target ${targetFolder}. Reason:`, err);
				}

				let repoLatestTag;
				//read latest tag from repo
				try {
					repoLatestTag = readLatestTagFromRepo(targetFolder);
					if (repoLatestTag) {
						console.log(`The latest tag for repo is ${repoLatestTag}`);
					} else {
						console.log(`Not able to retrieve any tag for this target ${targetFolder}`);
					}
				} catch (err) {
					octopus.handleError(`Not able to perform the saving state process for target ${targetFolder}. Reason:`, err);
				}

				if (repoLatestTag === "") {
					console.log("Taking action in order to create first tag.");
					//if repoLatestTag is empty string... no published tags until now...
					//we need to create a tag for the latest commit
					repoLatestTag = packageVersion || utils.DEFAULT_VERSION;
					if (repoLatestTag === utils.DEFAULT_VERSION && repoLatestTag.indexOf(packageVersion) === -1) {
						console.log(`package.json needs update in order to set version number ${repoLatestTag}`);
						ensureVersionInPackageJSON(targetFolder, repoLatestTag);
						console.log(`package.json version updated`);
						await commitPackageJSON(targetFolder);
						console.log(`created a commit with the package.json update`);
					}
					repoLatestTag = "v" + repoLatestTag;
					await createTag(targetFolder, repoLatestTag);
				}

				//we have already a tag and we need to check it's commit number agains the current commit number
				let tagCommitNumber = getCommitForTag(targetFolder, repoLatestTag);
				let currentSHA = readCommitSHA(targetFolder);
				action.commit = currentSHA;
				if (tagCommitNumber !== currentSHA) {
					console.log("Tag SHA === current last commit SHA comparison failed", `<${tagCommitNumber}>`, `<${currentSHA}>`);
					console.log("These means that the repo has new commits and needs a tag or is not update to date somehow.");
					let tagDate = getTagDate(targetFolder, repoLatestTag);
					let commitDate = getCommitDate(targetFolder, currentSHA);
					console.log(`Comparing dates of the tag and latest commit, ${tagDate} < ${commitDate}`);
					if (tagDate < commitDate) {
						console.log("Current state of the repo shows that a new tag needs to be created!");
						repoLatestTag = await incrementTag(repoLatestTag);
						ensureVersionInPackageJSON(targetFolder, repoLatestTag);
						commitPackageJSON(targetFolder);
						await createTag(targetFolder, repoLatestTag);
						action.commit = getCommitForTag(targetFolder, repoLatestTag);
					} else {
						let commits = checkIfAnyCommitsBetweenDates(commitDate, tagDate, targetFolder);
						console.log("Commits", commits);
						if(!commits.length){
							console.log("We have the version of the repo. Good to go!");
						}else{
							octopus.handleError(`Not able to perform the saving state process for target ${targetFolder}. Reason:`, "Repo current state shows that repo is not up2date");
							return;
						}
					}
				}
				action.tag = repoLatestTag;

				//validation of the commit number
				let validCommitSHA = validateCommitSHA(action.commit, targetFolder);
				if (action.commit && action.commit !== validCommitSHA) {
					let initialCommit = action.commit;
					action.commit = validCommitSHA;
					console.log(`\t * Warning: Commit number was replace for the module ${targetFolder} to ${action.commit} which represents a freezed version.`);
					console.log(`\t If the replacement of the commit number isn't desired set manualy the commit number ${initialCommit}`)
				}


				console.log(`smartClone action for ${targetFolder} looks like this: ${JSON.stringify(action)}`);
			} else {
				notFoundFolders.push(targetFolder);
			}
		}

		console.log(`The scanning process will be performed for the following task lists `, targets);
		for(let index=0; index<targets.length; index++){
			const target = targets[index];
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
						await updateSmartCloneAction(task, action);
					}
				}
			}
		};
		resolve();
	});
}

console.log(`=======================================================================`);
console.log(` Info: You are running the new Octopus Freeze mechanism based on TAGs.`);
console.log(`=======================================================================`);

let config = octopus.readConfig();
freezeConfig(config).then(() => {
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
		console.log("Configuration file  " + octopus.getConfigFile() + " updated.");
	});
});
