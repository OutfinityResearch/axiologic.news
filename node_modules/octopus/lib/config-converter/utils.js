function splitLine(line) {
    let [type, ...raw] = line.split(/\s/).map(item => item.trim()).filter(String);
    raw = raw.join(' ');
    return [type, raw];
}

function substrParam(str) {
    str = str.trim();
    const sep = str[0];
    if (!['"', "'"].includes(sep)) {
        throw `
            "${sep}" is not a valid separator!\n
            Please use ' or ".    
        `
    }
    str = str.substring(1);
    for (let i = 0; i < str.length; i++) {
        if (str[i] === sep) {
            return [str.substring(0, i), str.substring(i + 1)];
        }
    }
}

function substrArgs(str) {
    function assignOption(chain, value) {
        if (typeof chain === 'string') {
            chain = chain.split('.');
            for (let type of ['--', '-']) {
                if (chain[0].startsWith(type)) {
                    chain[0] = chain[0].substring(type.length);
                }
            }
        }
        if (!Array.isArray(chain)) {
            return [null];
        }

        if (chain.length > 1) {
            value = { [chain[chain.length - 1]]: value }
        }
        for (let i = chain.length - 2; i > 0; i--) {
            value = { [chain[i]]: value }
        }
        return [chain[0], value];
    }

    function parseOptions(option) {
        const stringRegex = /([\w-.]+)=["'](.*)["']/; // --value="test"
        const primitiveRegex = /([\w-.]+)=([\d.]+|true|false|null|undefined)/; // --value=123
        const JSONRegex = /([\w-.]+)=({(?<={)\s*[^{]*?(?=[},])}|\[.*?])/; // --value=[1, '2'] --value={a: 1, b: '2'}
        const flagRegex = /([\w-.]+)/ // --flag

        let match = option.match(stringRegex);
        if (match && match.length === 3) {
            return assignOption(match[1], match[2]);
        }

        match = option.match(primitiveRegex);
        if (match && match.length === 3) {
            let value = match[2];

            let number = Number(value);
            if (!Number.isNaN(number)) {
                value = number;
            }

            switch (value) {
                case 'true':
                    value = true; break;
                case 'false':
                    value = false; break;
                case 'null':
                    value = null; break;
                case 'undefined':
                    value = undefined; break;
            }

            return assignOption(match[1], value);
        }

        match = option.match(JSONRegex);
        if (match && match.length === 3) {
            try {
                return assignOption(match[1], JSON.parse(match[2]));
            } catch (error) {
                console.error(error);
                console.log({ key: match[1] });
                console.log({ value: match[2] });
                return [null];
            }
        }

        match = option.match(flagRegex);
        if (match && match.length === 2) {
            return assignOption(match[1], true);
        }
    }

    str = str.trim();
    if (!str) {
        return {
            found: false
        };
    }

    const options = str.match(/[^\s"'{\[]+|"([^"]*)"|'([^']*)'|{(?<={)\s*[^{]*?(?=[},])}|\[.*?]/g);

    let params = [{}];

    // RegExp cleanup and prepare
    for (let i = 0; i < options.length; i++) {
        // an option "--arg=" with a value that statsWith ", {, [ was used
        if (options[i].startsWith('-') && options[i].endsWith('=')) {

            // --arg= is last element
            if (typeof options[i + 1] === 'undefined') {
                options.splice(i, 1);
                i--;
                continue;
            }

            // --arg= is not followed by a value
            if (['-', '='].includes(options[i + 1][0])) {
                options.splice(i, 1);
                i--;
                continue;
            }

            options[i] += options[i + 1];
            options.splice(i + 1, 1);
            continue;
        }

        // an option used spaces "--arg = <value>"
        if (options[i] === '=') {

            // = is the first element or the last element
            if (i === 0 || i === options.length - 1) {
                options.splice(i, 1);
                i--;
                continue;
            }

            options[i - 1] += '=';
            options.splice(i, 1);
            i -= 2; // first if comes here to resolve
            continue;
        }

        // an option used space "--arg =<value>"
        if (options[i].startsWith('=')) {

            // "=" is the first element (without option name) or
            // assign to a non option
            if (typeof options[i - 1] === 'undefined' || !options[i - 1].startsWith('-')) {
                options.splice(i, 1);
                i--;
                continue;
            }

            options[i - 1] += options[i];
            options.splice(i, 1);
            i--;
            // continue;
        }
    }

    // save actions and their options
    for (const option of options) {
        if (!option.startsWith('-')) {
            // a option type for an action
            params.push({ type: option });
            continue;
        }

        if (option.startsWith('-')) {
            const [key, value] = parseOptions(option);
            if (key) {
                params[params.length - 1][key] = value;
            }
        }
    }

    return {
        found: true,
        args: params
    };
}

function mergeDeep(...objects) {
    const isObject = obj => obj && typeof obj === 'object';

    return objects.reduce((prev, obj) => {
        Object.keys(obj).forEach(key => {
            const pVal = prev[key];
            const oVal = obj[key];

            if (Array.isArray(pVal) && Array.isArray(oVal)) {
                prev[key] = pVal.concat(...oVal);
            }
            else if (isObject(pVal) && isObject(oVal)) {
                prev[key] = mergeDeep(pVal, oVal);
            }
            else {
                prev[key] = oVal;
            }
        });

        return prev;
    }, {});
}

module.exports = {
    mergeDeep,
    splitLine,
    substrArgs,
    substrParam
}
