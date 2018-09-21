import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import fileType from 'file-type';
import readdir from 'recursive-readdir';

/**
 * It checks if a file is an MP3
 * TODO: exclude from paths all the paths that are already included by at least one path,
 * to avoid their duplication in the final result
 * @param  {Buffer|String}  param File's path or its Buffer representation
 * @return {Boolean}       true if it's an MP3, false otherwise
 */
export function isMp3(param) {
    let fileRes;
    if (Buffer.isBuffer(param)) {
        fileRes = fileType(param);
    } else if (!_.isEmpty(param) && _.isString(param)) {
        const buf = fs.readFileSync(param);
        fileRes = fileType(buf);
    }

    return !_.isEmpty(fileRes) && fileRes.ext === 'mp3';
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
        for (const thePath of paths) {
            const stats = fs.statSync(thePath);

            if (stats.isFile()) {
                if (isMp3(thePath)) {
                    files.push(thePath);
                }
            } else if (stats.isDirectory()) {
                promises.push(new Promise((resolve, reject) => {
                    fs.readdir(thePath, /* { encoding: 'buffer' }, */ (err, result) => {
                        if (err) {
                            return reject(err);
                        }

                        const theFiles = result
                            .filter((file) => fs.statSync(path.join(thePath, file)).isFile())
                            .map((file) => path.join(thePath, file));

                        return resolve(theFiles);
                    });
                }));
            }
        }

        if (promises.length) {
            const filesFound = _.flatten(await Promise.all(promises));
            const songsPaths = filesFound.filter((file) => isMp3(file));
            return _.union(files, songsPaths);
        }

        return files;
    }

    for (const thePath of paths) {
        promises.push(readdir(thePath, [function ignoreFiles(file) {
            return !isMp3(file);
        }]));
    }

    const arrayOfFilesArray = await Promise.all(promises);
    return _.flatten(arrayOfFilesArray);
}
