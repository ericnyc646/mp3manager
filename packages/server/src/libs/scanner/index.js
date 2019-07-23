const path = require('path');
const mm = require('music-metadata');
const _ = require('underscore');
const fs = require('fs');
const audioType = require('audio-type');
const util = require('util');
const { promisify } = require('util');
const logger = require('../logger');

const getStats = promisify(fs.stat);
const readdir = promisify(fs.readdir);
// https://github.com/winstonjs/winston#profiling

class MusicScanner {
    /**
     * @param {Object} options it may contain:
        - paths (Array): a list of URI to be scanned, every item could be a file or a directory
        - workers (Int): numers of processes, by default equal to the cores of the machine
        - queueName (String): not particularly relevant for his use case (one queue only)
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
        };
        logger.debug('Music scanner options', options);
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

    async processDirectory(dir) {
        const dirents = await readdir(dir, { withFileTypes: true });

        await Promise.all(dirents.map(async (dirent) => {
            const resource = path.resolve(dir, dirent.name);

            if (dirent.isDirectory()) {
                return this.processDirectory(resource);
            }
            
            if (dirent.isFile()) {
                const buf = fs.readFileSync(resource);
                const fileRes = audioType(buf);          
                if (fileRes === 'mp3') {
                    const metadata = await mm.parseBuffer(buf, '.mp3', { duration: true });
                    const { format, common } = metadata;
                    this.processResult.totFiles += 1;
                }
            }
        }));
    }

    async scan() {
        const promises = [];

        const start = Date.now();

        for (const thePath of this.paths) {
            promises.push(this.processDirectory(thePath));
        }

        await Promise.all(promises);
        const end = new Date(Date.now() - start);
        const humandate = `${end.getUTCHours()} hours, ${end.getUTCMinutes()} minutes and ${end.getUTCSeconds()} second(s)`;

        this.processResult.executionTime = humandate;
        return this.processResult;
    }
}

module.exports = MusicScanner;
