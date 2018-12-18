import util from 'util';

/**
 * Shortcut for inspecting an object
 * @param {Object} obj
 */
export function inspect(obj) {
    console.log(util.inspect(obj, {
        showHidden: true,
        depth: null,
        colors: true,
    }));
}