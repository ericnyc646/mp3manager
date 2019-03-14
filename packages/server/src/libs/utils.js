const util = require('util');
const path = require('path');
const _ = require('underscore');
const cp = require('child_process');

const execFile = util.promisify(cp.execFile);
const exec = util.promisify(cp.exec);

/**
 * Executes an external program passing some arguments to it
 * @param {String} cmd command's name
 * @param {Array|String} args arguments to be passed to the command
 * @param {Object} options execFile's options
 * @returns {Promise} it returns an object with stdout, stderr and error keys
 * @see https://nodejs.org/docs/latest-v10.x/api/child_process.html#child_process_child_process_execfile_file_args_options_callback
 */
async function execute(cmd, args, options = {}) {
    let finalArgs;

    if (_.isArray(args)) {
        finalArgs = args;
    } else if (_.isString(args)) {
        finalArgs = args.split(/\s/);
    }

    return execFile(cmd, finalArgs, options);
}

/**
 * It prints a string representation of an object that is intended for debugging
 * @param {Object} obj Any JavaScript primitive or Object
 * @see https://nodejs.org/dist/latest-v10.x/docs/api/util.html#util_util_inspect_object_options
 */
function inspect(obj) {
    console.log(util.inspect(obj, {
        showHidden: true, // includes the object's non-enumerable symbols and properties
        depth: null, // make it recurse up to the maximum call stack size
        colors: true, // output styled with ANSI color codes
    }));
}

/**
 * Escapes all quotes chars and wrap the path between quotes. This is useful only
 * when using child_process' functions to pass paths as arguments
 * @param {string} path the file's path
 */
function safePath(filePath) {
    if (_.isEmpty(filePath)) {
        return '';
    }

    return `"${filePath.replace(/("+)/g, '\\$1')}"`;
}

/**
 * It calculates the MD5 of the music file, ignoring the metadata
 * @param {string} filePath absolute path of the music file
 * @returns {string} the file's MD5 without metadata
 */
async function mp3hash(filePath) {
    const exePath = path.join(__dirname, '../../../../external/mp3hash/mp3hash');
    const musicFile = `"${filePath.replace(/("+)/g, '\\$1')}"`;
    const { stdout, stderr } = await exec(`${exePath} ${musicFile}`);

    if (!_.isEmpty(stderr)) {
        throw new Error(stderr);
    }
    return stdout.split(' ')[0];
}

module.exports = {
    inspect,
    execute,
    mp3hash,
    safePath,
};
