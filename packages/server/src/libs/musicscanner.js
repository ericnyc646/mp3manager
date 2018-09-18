import _ from 'underscore';
import fs from 'fs';
import fileType from 'file-type';
import readChunk from 'read-chunk';
import readdir from 'recursive-readdir';

/**
 * It checks if a file is an MP3
 * TODO: exclude from paths all the paths that are already included by at least one path,
 * to avoid their duplication in the final result
 * @param  {Buffer|String}  param File's path or its Buffer representation
 * @return {Boolean}       true if it's an MP3, false otherwise
 */
export function isMp3(param) {
    if (Buffer.isBuffer(param)) {
        return fileType(param).ext === 'mp3';
    }

    if (!_.isEmpty(param) && _.isString(param)) {
        const buf = readChunk(param, 0, 3);
        return fileType(buf).ext === 'mp3';
    }

    return false;
}

/**
 * It scans the specified locations to look up MP3 files
 * @param  {Object} [options={}] it may have the following fields:
 * - paths (Array) an array of paths (usually directories) to look for music files
 * - recursive (Boolean) if to search recursively for music in subdirectories
 * @return {Promise (Array)}    A list of files' paths of all the MP3 found
 */
export async function musicScan(options = {}) {
    const { paths = [], recursive = true } = options;

    if (_.isEmpty(paths)) {
        throw new Error('you must specify a list of paths');
    }

    const files = [];
    const promises = [];

    if (!recursive) {
        for (const path of paths) {
            const stats = fs.statSync(path);
            if (stats.isFile()) {
                if (isMp3(path)) {
                    files.push(path);
                }
            } else if (stats.isDirectory()) {
                promises.push(new Promise((resolve, reject) => {
                    fs.readdir(path, /* { encoding: 'buffer' }, */ (err, theFiles) => {
                        if (err) {
                            return reject(err);
                        }

                        return resolve(theFiles);
                    });
                }));
            }
        }

        if (promises.length) {
            const filesFound = await Promise.all(promises);
            const songsPaths = filesFound.filter((file) => isMp3(file));
            return _.union(files, songsPaths);
        }

        return files;
    }

    for (const path of paths) {
        promises.push(readdir(path, [function ignoreFiles(file) {
            return !isMp3(file);
        }]));
    }

    const arrayOfFilesArray = await Promise.all(promises);
    return _.flatten(arrayOfFilesArray);
}
