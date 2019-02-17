const _ = require('underscore');
const { execute } = require('./utils');

class EyeD3 {
    static isError(stderr, error) {
        const err = stderr || error;

        if (_.isEmpty(err)) {
            return false;
        }

        if (err.includes('command not found')) {
            let warnMessage = "It seems you don't have eyeD3 installed.\n";
            warnMessage += 'Use pip install eyeD3 python-magic-bin: ';
            warnMessage += 'https://eyed3.readthedocs.io/en/latest/installation.html';
            console.error(warnMessage);
            return true;
        }

        console.error(err);
        return true;
    }

    static async version() {
        const { stdout, stderr, error } = await execute('eyeD3', '--version');
        if (this.isError(stderr, error)) {
            return null;
        }

        return stdout;
    }
}

module.exports = EyeD3;
