/**
 * This exported function is called by Bull whenever is added
 * a new task.
 * *DO NOT USE any ES6 syntax*, this module is executed by spawned processes
 * which will understand just what Node.js supports
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const isMp3 = require('./ismp3');

const stat = promisify(fs.stat);
const readdir = promisify(fs.readdir);

/**
 * @param {Object} job passed by Queue#add method
 * @returns {Promise} An object containing the files or the error occurred
 */
module.exports = function musicQueue(job) {
    // using reject doesn't make bull aware of the job's termination,
    // so we resolve the error
    return new Promise(async (resolve) => {
        try {
            const { directory } = job.data;
            const stats = await stat(directory);
            let resources = [];

            if (stats.isFile()) {
                if (isMp3(directory)) {
                    resources.push(directory);
                }
            } else if (stats.isDirectory()) {
                const result = await readdir(directory);
                resources = result
                    .filter(async (file) => {
                        const thePath = path.join(directory, file);
                        if ((await stat(thePath)).isFile()) {
                            return isMp3(thePath);
                        }

                        return false;
                    })
                    .map((file) => path.join(directory, file));
            }

            return resolve({ resources });
        } catch (e) {
            return resolve({
                error: true,
                message: e.message,
                stack: e.stack,
            });
        }
    });
};
