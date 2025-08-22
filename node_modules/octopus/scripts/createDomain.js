const DEFAULT_PSK_BUNDLES_PATH = "./../opendsu/builds/output";

const DEFAULT_DOMAIN_SEED_PATH = "./domain-seed";
const DEFAULT_DOMAIN = "default";
const DEFAULT_DSU_TYPE_SSI_PATH = "./seed";

const BUNDLES_TAG = "--bundles=";
const SEED_TAG = "--seed=";
const DOMAIN_TAG = "--domain=";
const DSU_TYPE_SSI_TAG = "--dsu-type-ssi=";

const path = require("path");

const parse_arguments = function (arguments) {
    let config, seed, domain, bundles, dsuTypeSSI;
    arguments.forEach((a) => {
        if (!a) return;
        if (a.includes(BUNDLES_TAG)) bundles = a.replace(BUNDLES_TAG, "");
        else if (a.includes(DOMAIN_TAG)) domain = a.replace(DOMAIN_TAG, "");
        else if (a.includes(SEED_TAG)) seed = a.replace(SEED_TAG, "");
        else if (a.includes(DSU_TYPE_SSI_TAG)) dsuTypeSSI = a.replace(DSU_TYPE_SSI_TAG, "");
        else if (config === undefined) config = a;
        else throw new Error("invalid arguments. Only one path to build file is accepted");
    });

    return {
        seed: seed || DEFAULT_DOMAIN_SEED_PATH,
        domain: domain || DEFAULT_DOMAIN,
        bundles: bundles || DEFAULT_PSK_BUNDLES_PATH,
        dsuTypeSSI: dsuTypeSSI || DEFAULT_DSU_TYPE_SSI_PATH,
    };
};

const createDomainFinishedCallback = function (err, result) {
    let projectName = path.basename(process.cwd());

    if (err) {
        console.log(`Build process of <${projectName}> failed.`);
        console.log(err);
        process.exit(1);
    }

    console.log(`Build process of <${projectName}> finished. Dossier's KeySSI:`, result);
};

const createAndMountContractDSU = function (domain, mainDSU, contractName, callback) {
    const opendsu = require("opendsu");
    const resolver = opendsu.loadApi("resolver");
    const keyssi = opendsu.loadApi("keyssi");

    console.log(`Creating DSU for contract ${contractName}...`);
    resolver.createDSU(keyssi.createTemplateSeedSSI(domain), (err, contractDSU) => {
        if (err) {
            return callback(err);
        }

        contractDSU.getKeySSIAsString((err, contractKeySSI) => {
            if (err) {
                return callback(err);
            }

            console.log(`Mounting DSU for contract ${contractName} at /${contractName}...`);
            mainDSU.mount(`/${contractName}`, contractKeySSI, (err) => {
                if (err) {
                    return callback(err);
                }

                callback(null);
            });
        });
    });
};

const createAndMountAllContractDSUs = function (cfg, mainDSU, dsuTypeSSI, callback) {
    const opendsu = require("opendsu");
    const resolver = opendsu.loadApi("resolver");

    resolver.loadDSU(dsuTypeSSI, (err, dsuType) => {
        if (err) {
            return callback(err);
        }

        dsuType.listFolders("/", (err, dsuTypeFiles) => {
            if (err) {
                return callback(err);
            }

            const contractNames = dsuTypeFiles.filter((file) => file && file !== "boot");
            console.log(`Found ${contractNames.length} contract(s): ${contractNames}`);

            const createAndMountEachRemainingContractDSU = () => {
                if (!contractNames.length) {
                    return callback();
                }

                const contractName = contractNames.shift();
                createAndMountContractDSU(cfg.domain, mainDSU, contractName, (err) => {
                    if (err) {
                        return callback(err);
                    }

                    createAndMountEachRemainingContractDSU();
                });
            };

            createAndMountEachRemainingContractDSU();
        });
    });
};

/**
 * Octopus Script to aid in the domain Dossier Building process via the 'dt' api DossierBuilder
 * Accepted Arguments:
 * * (optional) path to build file (defaults to ./bin/build.file)
 * Flags:
 *  * bundles: sets the bundles path, ex:
 * <pre>
 *     --bundles=./../.../opendsu/bundles
 * </pre>
 * defaults to './../opendsu/builds/output'
 * * dsu-type-ssi: sets the path for the seed file of the DSU type of the domain being build, ex:
 * <pre>
 *     --dsu-type-ssi=./../seed
 * </pre>
 * defaults to './seed'
 * * seed: sets the path for the seed file of the domain's dossier being build, ex:
 * <pre>
 *     --seed=./../domain-seed
 * </pre>
 * defaults to './seed'
 * * domain: sets the desired domain, ex:
 * <pre>
 *     --domain=epi
 * </pre>
 * defaults to 'default'
 */
const createDomain = function (cfg, dsuTypeSSI) {
    const commands = ["delete /"];

    let openDSU_bundle = path.join(process.cwd(), cfg.bundles, "openDSU.js");
    require(openDSU_bundle);

    const opendsu = require("opendsu");
    const resolver = opendsu.loadApi("resolver");

    let dossier_builder = opendsu.loadApi("dt").getDossierBuilder();
    dossier_builder.buildDossier(cfg, commands, (err, seedSSI) => {
        if (err) {
            return createDomainFinishedCallback(err);
        }

        resolver.loadDSU(seedSSI, (err, dsu) => {
            if (err) {
                return createDomainFinishedCallback(err);
            }

            createAndMountAllContractDSUs(cfg, dsu, dsuTypeSSI, (err) => {
                if (err) {
                    return createDomainFinishedCallback(err);
                }

                dsu.mount("/code", dsuTypeSSI, (err) => {
                    if (err) {
                        return createDomainFinishedCallback(err);
                    }

                    createDomainFinishedCallback(null, seedSSI);
                });
            });
        });
    });
};

let args = process.argv;
args.splice(0, 2);

const octopus = require("./index.js");

if (args.length > 4)
    octopus.handleError(
        "Expected to receive 1 optional param <buildFile> path the the build file. defaults to './bin/build.json'"
    );

let config = parse_arguments(args);

const fs = require("fs");

let dsuTypeSSIFile = config.dsuTypeSSI;
try{
    const utils = require("./utils.js");
    dsuTypeSSIFile = utils.validatePath(dsuTypeSSIFile);
}catch(err){
    return octopus.handleError("Path traversal detected", err);
}

fs.access(dsuTypeSSIFile, fs.F_OK, (err) => {
    if (err) {
        console.error(`DSU Type SSI file not found at ${dsuTypeSSIFile}`);
        return createDomainFinishedCallback(err);
    }

    fs.readFile(dsuTypeSSIFile, (err, data) => {
        if (err) octopus.handleError("Configuration file exists, but could not be read", err);

        let dsuTypeSSI = data.toString();
        createDomain(config, dsuTypeSSI);
    });
});
