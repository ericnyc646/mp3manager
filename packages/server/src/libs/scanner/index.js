const path = require('path');
// const mt = require('jsmediatags');
const ffmetadata = require('ffmetadata');
const _ = require('underscore');
const fs = require('graceful-fs');
const readline = require('readline');

// const audioType = require('audio-type');
// const util = require('util');
const { promisify } = require('util');
const MusicFile = require('../../../src/models/db/mongo/music_files');

const getStats = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
// https://github.com/winstonjs/winston#profiling

class MusicScanner {
    /**
     * @param {Object} options it may contain:
        - paths (Array): a list of URI to be scanned, every item could be a file or a directory
        - keepInMemory (Boolean): if to store the results in the DB or to keep them in memory,
            returning the results (just for tests, sort of dry run)
     */
    constructor(options) {
        if (_.isEmpty(options) || _.isEmpty(options.paths) || !_.isArray(options.paths)) {
            throw new Error('You must specify the `paths` property (array)');
        }

        const { paths, keepInMemory } = options;

        this.paths = this.mapPaths(paths);
        this.keepInMemory = keepInMemory === true;
        this.processResult = {
            totFiles: 0,
            totBytes: 0,
            dirQueue: [],
        };
    }

    getQueue() {
        return this.queue;
    }

    mapPaths(paths = []) {
        return paths
            .reduce((accumulator, currentValue) => {
                const stats = fs.statSync(path.normalize(currentValue));
                if (!stats.isDirectory()) {
                    throw new Error(`Path ${currentValue} is not a directory`);
                }
      
                if (!path.isAbsolute(currentValue)) {
                    throw new Error(`Passing a relative path: ${currentValue}`);
                }
          
                // this first check gets rid of duplicates
                if (!accumulator.includes(currentValue)) {
                    // filters paths which include current value and are shorter
                    const res = paths.filter((el) => currentValue.startsWith(el) && currentValue.length > el.length);
                    // if no path includes the current dir, we select it
                    if (!res.length) {
                        accumulator.push(currentValue);
                    }
                }
      
                return accumulator;
            }, []);
    }

    /**
     * Example with jsmediatags
     * @param {Buffer} buf 
    readTags(buf) {
        return new Promise((resolve, reject) => {
            mt.read(buf, {
                onSuccess: (tag) => resolve(tag),
                onError: (error) => reject(error),
            });
        });
    } */

    readTags(filePath) {
        return new Promise((resolve, reject) => {
            ffmetadata.read(filePath, (err, data) => {
                if (err) {
                    return reject(err);
                }

                return resolve(data);
            });
        });
    }

    async processFile(resource) {
        if (path.extname(resource).toLowerCase() !== '.mp3') {
            return;
        }

        const tagsToExclude = [
            'MusicManager',
        ];
        this.processResult.totFiles += 1;
        const metadata = {};

        try {
            const data = await this.readTags(resource);

            for (const [key, value] of Object.entries(data)) {
                if (!tagsToExclude.includes(key)) {
                    metadata[key.replace(/\./g, '_')] = value;
                }
            }
        } catch (e) {
            console.log(resource, e.message);
        }
        const stats = await getStats(resource);
        const fileSize = stats.size;

        const fileInstance = {
            path: resource,
            fileSize,
            metadata,
        };

        MusicFile.create(fileInstance);
        
        this.processResult.totBytes += fileSize;
    }

    async processDirectory() {
        let filesPromises = [];

        while (this.processResult.dirQueue.length > 0) {
            const dir = this.processResult.dirQueue.shift();
            const dirents = await readdir(dir, { withFileTypes: true });
            
            for (const dirent of dirents) {
                const resource = path.resolve(dir, dirent.name);
                if (dirent.isDirectory()) {
                    this.processResult.dirQueue.push(resource);
                } else if (dirent.isFile()) {
                    filesPromises.push(this.processFile(resource));
                }
            }

            if (filesPromises.length >= 100) {
                await Promise.all(filesPromises);
                filesPromises = [];
            }
        }
    }

    logStats(totFiles) {
        readline.moveCursor(process.stdout, 0, -1);
        readline.clearLine(process.stdout, 0);
        console.log(`Scanned file count: ${totFiles}.`,
            `Heap total: ${parseInt(process.memoryUsage().heapTotal / 1024, 10)} KB, `,
            `used: ${parseInt(process.memoryUsage().heapUsed / 1024, 10)} KB`);
    }

    async scan() {
        const promises = [];

        const start = Date.now();

        for (const thePath of this.paths) {
            this.processResult.dirQueue.push(thePath);
            promises.push(this.processDirectory());
        }

        this.interval = setInterval(() => this.logStats(this.processResult.totFiles), 5000);

        const paths = await Promise.all(promises);
        const end = new Date(Date.now() - start);
        const humandate = `${end.getUTCHours()} hours, ${end.getUTCMinutes()} minutes and ${end.getUTCSeconds()} second(s)`;

        this.processResult.executionTime = humandate;
        this.processResult.paths = paths;
        return this.processResult;
    }
}

module.exports = MusicScanner;
