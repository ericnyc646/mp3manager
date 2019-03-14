const _ = require('underscore');
const { execute, mp3hash } = require('./utils');
const { scanner } = require('../config/getConfig');

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

        // generic error
        if (err.includes('error')) {
            console.error(err);
            return true;
        }

        return false;
    }

    /**
     * Comment tag used by the scanner to makr a file as scanned
     */
    static get TAG() {
        return 'MusicManager';
    }

    /**
     * Global method to run eyeD3
     * @param {Array|string} args arguments to be passed to eyeD3
     * @returns {Promise} null if an error happens, default stderr otherwise
     */
    static async run(args) {
        const { stderr, stdout, error } = await execute('eyeD3', args);
        
        const result = `${stderr}${stdout}`;

        if (this.isError(result, error)) {
            return null;
        }

        return result;
    }

    /**
     * Returns the eyeD3 version
     */
    static async version() {
        return this.run('--version').then((result) => result.trim());
    }

    /**
     * It strips away all the metadata from the file
     * @param {string} filePath absolute URL of the music file
     */
    static async removeAllTags(filePath) {
        return this.run(['--remove-all', filePath]);
    }

    /**
     * Used to mark the file as scanner. It may optionally remove
     * all other comments (default true)
     * @param {string} filePath file's absolute path
     */
    static async markFileAsScanned(filePath) {
        const description = EyeD3.TAG;
        const md5 = await mp3hash(filePath);
        const comment = `${description}-${md5}-${Date.now()}`; // the only part visible to music-metadata
        const lang = 'eng';
        // description and lang are unique among comments. If there's already
        // another comment with the same values, it gets overwritten.
        const finalComment = `${comment}:${description}:${lang}`;
        
        const args = [];
        const { removeAllComments } = scanner;

        if (removeAllComments) {
            args.push('--remove-all-comments');
        }

        args.push('--add-comment');
        args.push(finalComment);
        args.push(filePath);
        
        return this.run(args);
    }
}

module.exports = EyeD3;
