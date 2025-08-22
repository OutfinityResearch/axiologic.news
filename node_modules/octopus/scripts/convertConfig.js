const octopus = require("./index");
const args = process.argv;

args.splice(0, 2);
if (args.length === 1 && args[0] === "devmode"){
    process.env.DEV = "true";
}

const config = octopus.readConfig();
const version = octopus.isDevelopment() ? "DEV" : "FREEZE";
const convertedType = octopus.getConfigFile().endsWith('json') ? "OCTOPUS" : "JSON";

octopus.changeConfigFile(octopus.CONFIG_FILE[version][convertedType]);

octopus.updateConfig(config, err => {
    if (err) {
        throw err;
    }
    console.log(`A new configuration file ${octopus.getConfigFile()} was generated.`);
});
