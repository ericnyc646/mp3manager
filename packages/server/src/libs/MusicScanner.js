import _ from 'underscore';
import fs from 'fs';
import path from 'path';
import fileType from 'file-type';
import readdir from 'recursive-readdir';

/**
 * It checks if a file is an MP3
 * @param  {Buffer|String}  param File's path or its Buffer representation
 * @return {Boolean}       true if it's an MP3, false otherwise
 */
export function isMp3(param) {
    let fileRes;
    try {
        if (Buffer.isBuffer(param)) {
            fileRes = fileType(param);
        } else if (!_.isEmpty(param) && _.isString(param)) {
            const buf = fs.readFileSync(param);
            fileRes = fileType(buf);
        }
    } catch (error) {
        console.error('isMp3 failed for ', param, error.message);
    }

    return !_.isEmpty(fileRes) && fileRes.ext === 'mp3';
}

/**
 * It removes from the array all the paths that are subdirectories of
 * another path in the list or that don't exist
 * @param  {Array}  [paths=[]] List of absolute paths
 * @return {Array}  The filtered original set of paths
 */
export function cleanPaths(paths = []) {
    const uniqPaths = _.uniq(paths).filter((item) => path.isAbsolute(item));

    return uniqPaths.map((pathItem) => {
        for (const refPath of uniqPaths) {
            const relative = path.relative(refPath, pathItem);
            const isSubdir = !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
            // console.log(`Scanning for ${pathItem}. Relative[${relative}] for ${refPath}: ${isSubdir}`);
            if (isSubdir) {
                return null;
            }
        }

        return pathItem;
    }).filter((item) => !_.isNull(item) && fs.existsSync(item));
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

    const filteredPaths = cleanPaths(paths);
    const files = [];
    const promises = [];

    if (!recursive) {
        for (const thePath of filteredPaths) {
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

    for (const thePath of filteredPaths) {
        promises.push(readdir(thePath, [function ignoreFiles(file, stats) {
            if (stats.isDirectory()) {
                return false;
            }

            return !isMp3(file);
        }]));
    }

    const arrayOfFilesArray = await Promise.all(promises);
    return _.flatten(arrayOfFilesArray);
}
