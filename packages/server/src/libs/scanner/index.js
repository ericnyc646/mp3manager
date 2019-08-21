const path = require('path');
const _ = require('underscore');
const fs = require('graceful-fs');
const readline = require('readline');
const { promisify } = require('util');
const MusicFile = require('../../../src/models/db/mongo/music_files');
const MetaInfo = require('../../../src/libs/scanner/mediainfo');
const EyeD3 = require('../../../src/libs/eyeD3');

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);

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

    async processFile(resource) {
        if (path.extname(resource).toLowerCase() !== '.mp3') {
            return;
        }

        this.processResult.totFiles += 1;
        const metadata = await MetaInfo.getData(resource);
        const fileSize = metadata.size;

        delete metadata.size;

        const fileInstance = {
            path: resource,
            fileSize,
            metadata,
        };

        // if (metadata.hasOwnProperty('image')) {
        //     const imgPath = await EyeD3.getCoverImage(resource);
        //     if (!_.isNull(imgPath)) {
        //         let data = await readFile(imgPath);
        //         fileInstance.coverImage = data;
        //         data = null;
        //     }
        // }

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

        //this.interval = setInterval(() => this.logStats(this.processResult.totFiles), 5000);
        
        await Promise.all(promises);
        const end = new Date(Date.now() - start);
        const humandate = `${end.getUTCHours()} hours, ${end.getUTCMinutes()} minutes and ${end.getUTCSeconds()} second(s)`;

        this.processResult.executionTime = humandate;
        //clearInterval(this.interval);

        return this.processResult;
    }
}

module.exports = MusicScanner;
