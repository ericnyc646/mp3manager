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

    /**
     * Global method to run eyeD3
     * @param {Array|string} args arguments to be passed to eyeD3
     * @returns {Promise} null if an error happens, default stdout otherwise
     */
    static async run(args) {
        const { stdout, stderr, error } = await execute('eyeD3', args);
        if (this.isError(stderr, error)) {
            return null;
        }

        return stdout;
    }

    /**
     * Returns the eyeD3 version
     */
    static async version() {
        return this.run('--version');
    }

    /**
     * It strips away all the metadata from the file
     * @param {string} filePath absolute URL of the music file
     */
    static async removeAllTags(filePath) {
        return this.run(['--remove-all', filePath]);
    }
}

module.exports = EyeD3;
