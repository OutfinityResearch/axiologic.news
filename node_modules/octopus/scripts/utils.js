const path = require("path");
const fs = require("fs");
const child_process = require('child_process');
const readlineModule = "readline";
const readline = require(readlineModule);

function askQuestion(question) {
	return new Promise((resolve, reject) => {
		const rl = readline.createInterface({
			input: process.stdin, output: process.stdout
		});
		rl.question(question, (answer) => {
			resolve(answer);
			rl.close();
		});
	});
}

module.exports.DEFAULT_VERSION = "1.0.0";

module.exports.createPackageJSON = function (targetFolder, version, license) {
	version = version || module.exports.DEFAULT_VERSION;
	license = license || "MIT";

	let packageDetails = {
		license,
		version,
		name: path.basename(targetFolder)
	};
	console.log("Preparing to write package.json file with the following basic info", JSON.stringify(packageDetails));
	fs.writeFileSync(path.join(targetFolder, "package.json"), JSON.stringify(packageDetails, null, 4));
}

module.exports.readVersionFromPackageJSON = async function (targetFolder) {
	let version;
	try {
		version = require(path.join(targetFolder, "package.json")).version;
	} catch (err) {
		if (err.code === "MODULE_NOT_FOUND") {
			console.log(`Not able to read package.json file.`);
			const answer = await askQuestion(`Would you like to initiate a package.json and commit it for you? [y/n] `);
			if (answer === 'y') {
				version = module.exports.DEFAULT_VERSION;
				module.exports.createPackageJSON(targetFolder, version);
				module.exports.commitPackageJSON(targetFolder);
			}
		}
	}
	return version;
}

module.exports.readLatestTagFromRepo = function (targetFolder) {
	try{
		console.log("Trying to do a fetch --all --tags. Please wait.");
		child_process.execSync("git fetch --all --tags", {cwd: targetFolder, stdio: 'pipe'});
	}catch(e){
		//we ignore on purpose any errors durring git fetch
	}
	console.log("Reading latest tag");
	let out = child_process.execSync("git for-each-ref refs/tags --sort=-creatordate --format='%(refname:short)' --count=1", {cwd: targetFolder, stdio: 'pipe'}).toString().trim();
	let tagRegex = /[vV]+[0-9]+.[0-9]+[.0-9]*/gm;
	if (out) {
		console.log(`Read tag <${out}> as latest tag`);
	}
	if (out !== "" && !out.match(tagRegex)) {
		console.log("tag format not valid", out, "expected", tagRegex);
		console.log(`returning empty tag instead of ${out}`);
		out = "";
	}
	return out;
}

module.exports.ensureVersionInPackageJSON = function (targetFolder, version) {
	let pth = path.join(targetFolder, "package.json");
	let package = require(pth);
	package.version = version;
	fs.writeFileSync(pth, JSON.stringify(package, null, 4));
}

module.exports.commitPackageJSON = async function (targetFolder) {
	let out;
	out = child_process.execSync("git add package.json", {cwd: targetFolder}).toString().trim();
	if (out) {
		console.log(out);
	}
	out = child_process.execSync(`git commit -m "preparing for a new tag publish"`, {cwd: targetFolder}).toString().trim();
	if (out) {
		console.log(out);
	}

	const answer = await askQuestion('Package file was updated and commited do you want to push the changes?[y/n] ');
	if (answer === "y") {
		const cmd = `git push origin --all`;
		console.log("Preparing to execute", cmd);
		out = child_process.execSync(cmd, {cwd: targetFolder}).toString().trim();
		if (out) {
			console.log(out);
		}
	} else {
		console.log(`answear different than "y", git push command execution postpone!`);
	}

	return;
}

module.exports.incrementTag = async function (tag) {
	let prefix = "";
	if (["v", "V"].indexOf(tag[0]) !== -1) {
		prefix = tag[0];
		tag = tag.substring(1);
	}
	let segments = tag.split(".");

	while (segments.length < 3) {
		segments.push("0");
	}

	segments[2] = parseInt(segments[2]);
	segments[2]++;

	let newTag = segments.join(".");
	newTag = prefix+newTag;
	const answer = await askQuestion(`Incremented tag version to ${newTag}. You can enter the desired value or hit [n] to use the default. `);
	if(answer!=="n"){
		console.log(`Tag value entered: ${answer}`);
		newTag = answer;
	}
	return newTag;
}

module.exports.getCommitForTag = function (targetFolder, tag) {
	const cmd = `git rev-list -n 1 ${tag}`;
	console.log("Executing cmd", cmd, "in target folder", targetFolder);
	let out;
	try{
		out = child_process.execSync(cmd, {cwd: targetFolder}).toString().trim();
	}catch(err){
		console.log(err);
	}

	return out;
}

module.exports.createTag = async function (targetFolder, tag) {
	let out;
	try {
		out = child_process.execSync(`git tag -a ${tag} -m "new tag release ${tag}"`, {cwd: targetFolder}).toString().trim();
		if(out){
			console.log(out);
		}

		const answer = await askQuestion(`Tag ${tag} was created, do you want to push the changes?[y/n] `);
		if (answer === "y") {
			const cmd = `git push origin refs/tags/${tag}`;
			console.log("Preparing to execute cmd", cmd);
			out = child_process.execSync(cmd, {cwd: targetFolder}).toString().trim();
			if (out) {
				console.log(out);
			}
		} else {
			console.log(`answear different than "y", git push command execution postpone!`);
		}

	} catch (err) {
		console.log(err);
	}
	//
	return;
}

module.exports.readCommitSHA = function (targetFolder) {
	let commitNumber;
	let out = child_process.execSync("git rev-parse HEAD", {cwd: targetFolder}).toString().trim();
	if (out.length == 40) {
		commitNumber = out;
	}
	console.log(`${targetFolder} is at revision ${out}`);
	return commitNumber;
}

module.exports.checkIfAnyCommitsBetweenDates = function (date1, date2, targetFolder) {
	const cmd = `git log --since "${date1 + 1}" --until "${date2}" --pretty=format:"%h %an %ad"`;
	console.log("Checking if there are any commits between dates.")
	console.log("Executing cmd", cmd);
	let out = child_process.execSync(cmd, {cwd: targetFolder}).toString().trim();
	out = out.split("\n");
	out = out.filter(item => item !== "");
	return out;
}

module.exports.getCommitDate = function (targetFolder, sha) {
	return child_process.execSync(`git show -s --format=%ct ${sha}`, {cwd: targetFolder}).toString().trim();
}

module.exports.getTagDate = function (targetFolder, tag) {
	let out = child_process.execSync(`git tag --list '${tag}' --format '%(creatordate:raw)'`, {cwd: targetFolder}).toString().trim();
	if (out) {
		out = out.split(" ");
		out.pop();
	}
	return out.length > 0 ? out[0] : out;
}

module.exports.validateCommitSHA = function (commitSHA, targetFolder) {
	let goodCommitNumber = commitSHA;
	let basicProcOptions = {cwd: targetFolder};
	let extendedProcOptions = {cwd: targetFolder, stdio: ['pipe', 'pipe', 'ignore']};
	try {
		//confirming that the module has the freeze mechanism enabled
		child_process.execSync("git cat-file -e HEAD:octopus-freeze.json", extendedProcOptions);
		//test if the repo is in a shallow clone form
		let isShallow = child_process.execSync("git rev-parse --is-shallow-repository", basicProcOptions).toString().trim();
		if (isShallow !== "false") {
			//convert the shallow clone to a full one in order to be able to search the last commit number for the freeze mechanism
			child_process.execSync("git fetch --unshallow", extendedProcOptions);
		}
		//this variable will have the reference of the last commit when the octopus-freeze file was modified
		let freezeCommitNumber = child_process.execSync("git log -n 1 --format=\"%H\" -- octopus-freeze.json", basicProcOptions).toString().trim();
		if (commitSHA !== freezeCommitNumber) {
			console.log(`Instead of ${commitSHA} we will use the ${freezeCommitNumber} commit due to the fact that is the last freezed version`);
			goodCommitNumber = freezeCommitNumber;
		} else {
			console.log(`\t* Module <${targetFolder}> has a freeze mechanism enabled and the commit number checked. All good here!`);
		}
	} catch (err) {
		//we ignore any error caught here because this validation does not affect the freeze mechanism
	}
	return goodCommitNumber;
}

module.exports.validatePath  = function(user_input) {
	if (user_input.indexOf('\0') !== -1) {
		throw 'Access denied';
	}
	if (!/^(?:(?:\.\/|\/)(?!.*(?:^|\/)\.\.(?:\/|$))(?:[^\/\s]+\/)*[^\/\s]*|\/)$/.test(user_input)) {
		throw 'Access denied';
	}
	let path = require('path');
	let safe_input = path.normalize(user_input).replace(/^(\.\.(\/|\\|$))+/, '');

	return safe_input;
}
