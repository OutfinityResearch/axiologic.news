//this script needs to be runned only on freeze installation process in order to ensure that the repo it is in a freeze state
//e.g. cloning a workspace to a different commit number and doing a npm install can generate issues and unwanted results

if(process.env.DEV === "true"){
	console.log("Skipping the rollback action to a freeze version due to the env flag DEV=true\n");
	process.exit(0);
}

const child_process = require("child_process");
let freezeCommitNumber;
let currentCommitNumber;
try{
	//confirming that the module has the freeze mechanism enabled
	child_process.execSync("git cat-file -e HEAD:octopus-freeze.json", {stdio: ['pipe', 'pipe', 'ignore']});
	//test if the repo is in a shallow clone form
	let isShallow = child_process.execSync("git rev-parse --is-shallow-repository").toString().trim();
	if(isShallow !== "false"){
		//convert the shallow clone to a full one in order to be able to search the last commit number for the freeze mechanism
		child_process.execSync("git fetch --unshallow", {stdio: ['pipe', 'pipe', 'ignore']});
	}
	//this variable will have the reference of the last commit when the octopus-freeze file was modified
	freezeCommitNumber = child_process.execSync("git log -n 1 --format=\"%H\" -- octopus-freeze.json").toString().trim();
	//this variable will have the referece of the current state
	currentCommitNumber = child_process.execSync("git log -n 1 --format=\"%H\"").toString().trim();
}catch(err){
	//we ignore any error caught here because this validation does not affect the freeze mechanism
}

if(freezeCommitNumber && currentCommitNumber && freezeCommitNumber !== currentCommitNumber){
	console.log(`Current state of the project is at commit number: ${currentCommitNumber}`);
	console.log(`Preparing to check out to specific commit number: ${freezeCommitNumber}`);
	console.log("Reason: to ensure that the project it is at the last freeze state correctly.\n");
	try{
		child_process.execSync(`git checkout ${freezeCommitNumber}`).toString().trim();
	}catch(err){
		console.log("\nError: \tThe rollback to a stable freeze version has failed!");
		console.log("\tCheck the Git errors above and take action before running again the install command!\n");
		process.exit(1);
	}
}
