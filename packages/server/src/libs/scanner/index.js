const path = require('path');
const mm = require('music-metadata');
const _ = require('underscore');
const fs = require('graceful-fs');

const audioType = require('audio-type');
// const util = require('util');
const { promisify } = require('util');
const logger = require('../logger');
const { mp3hash } = require('../../../src/libs/utils');
const MusicFile = require('../../../src/models/db/mongo/music_files');

const getStats = promisify(fs.stat);
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
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
            totBytes: 0,
            list: [],
            dirQueue: [],
        };
        logger.debug('Music scanner options', [options]);
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

    async scanDir(dir, fileList) {
        const files = await readdir(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            fileList.push(filePath);
            try {
                const stats = await getStats(filePath);
                if (stats.isDirectory()) {
                    await scanDir(filePath, fileList);
                }
            } catch (err) {
                console.error(err);
            }
        }
    
        return fileList;   
    }

    async processFile(resource) {
        const buf = await readFile(resource);
        const fileRes = audioType(buf);          
        if (fileRes === 'mp3') {
            this.processResult.list.push(resource);
            this.processResult.totFiles += 1;
            // const metadata = await mm.parseBuffer(buf, '.mp3', { duration: true });
            // const stats = await getStats(resource);
            // const fileSize = stats.size;
            // const audioHash = await mp3hash(resource);

            // const fileInstance = {
            //     path: resource,
            //     audioHash,
            //     fileSize,
            //     metadata,
            // };

            // await MusicFile.create(fileInstance);
            // this.processResult.totFiles += 1;
            // this.processResult.totBytes += fileSize;
            // logger.debug('File processed', [resource, this.processResult]);
        }
    }

    async processDirectory() {

        setInterval(() => this.logStats(this.processResult.list), 5000);

        while(this.processResult.dirQueue.length > 0) {
            const dir = this.processResult.dirQueue.shift();
            const dirents = await readdir(dir, { withFileTypes: true });
            const filesPromises = [];

            for (const dirent of dirents) {
                const resource = path.resolve(dir, dirent.name);
                if (dirent.isDirectory()) {
                    this.processResult.dirQueue.push(resource);
                } else if (dirent.isFile()) {
                    filesPromises.push(this.processFile(resource));
                }
            }

            await Promise.all(filesPromises);
        }
    }

    logStats(fileList) {
        console.log("Scanned file count: ",  this.processResult.totFiles);
        console.log(`Heap total: ${parseInt(process.memoryUsage().heapTotal/1024)} KB, used: ${parseInt(process.memoryUsage().heapUsed/1024)} KB`);
    }

    async scan() {
        const promises = [];

        const start = Date.now();

        for (const thePath of this.paths) {
            this.processResult.dirQueue.push(thePath);
            promises.push(this.processDirectory());
        }

        const paths = await Promise.all(promises);
        const end = new Date(Date.now() - start);
        const humandate = `${end.getUTCHours()} hours, ${end.getUTCMinutes()} minutes and ${end.getUTCSeconds()} second(s)`;

        this.processResult.executionTime = humandate;
        this.processResult.paths = paths;
        return this.processResult;
    }
}

module.exports = MusicScanner;
