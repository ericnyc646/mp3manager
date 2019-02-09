const util = require('util');

/**
 * Shortcut for inspecting an object
 * @param {Object} obj
 */
module.exports = function inspect(obj) {
    console.log(util.inspect(obj, {
        showHidden: true,
        depth: null,
        colors: true,
    }));
};
