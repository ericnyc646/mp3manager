const util = require('util');
const _ = require('underscore');
const execFile = util.promisify(require('child_process').execFile);

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

module.exports = {
    inspect,
    execute,
};
