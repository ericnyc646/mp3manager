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
            const { resource } = job.data;
            const stats = await stat(resource);
            const response = {
                musicFiles: [],
                directories: [],
            };

            if (stats.isFile()) {
                if (isMp3(resource)) {
                    response.musicFiles.push(resource);
                }
            } else if (stats.isDirectory()) {
                const result = await readdir(resource);
                response.musicFiles = result
                    .filter((file) => {
                        const thePath = path.join(resource, file);

                        if (fs.statSync(thePath).isFile()) {
                            return isMp3(thePath);
                        }

                        response.directories.push(thePath);
                        return false;
                    })
                    .map((filePath) => path.join(resource, filePath));
            }

            return resolve(response);
        } catch (e) {
            return resolve({
                error: true,
                message: e.message,
                stack: e.stack,
            });
        }
    });
};
