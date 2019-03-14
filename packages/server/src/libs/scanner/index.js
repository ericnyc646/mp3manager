const Queue = require('bull');
const os = require('os');
const path = require('path');
const _ = require('underscore');
const mm = require('music-metadata');
const File = require('../../models/db/File');
const FileDuplicated = require('../../models/db/FileDuplicated');
const { getConnection } = require('../../libs/pool');
const FileMetadata = require('../../models/db/FileMetadata');
const EyeD3 = require('../eyeD3');
const { mp3hash } = require('../utils');
const config = require('../../config/getConfig');

class MusicScanner {
    /**
     * Options may contain:
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

        const { paths, workers, queueName, keepInMemory } = options;

        this.paths = paths;
        this.workers = workers || os.cpus().length;
        this.keepInMemory = keepInMemory === true;

        this.queueName = queueName || 'music queue';
        this.queue = new Queue('music queue', { redis: config.redis });
        this.queue.process('*', this.workers, path.join(__dirname, 'processor.js'));

        this.jobsCompleted = 0; // incremented everytime a new job is added to the queue
        this.totalFiles = 0; // total Mp3 found by all the jobs
        this.totalJobs = this.paths.length; // total resources to scan
        this.totalMusicFiles = []; // used only if keepInMemory is true
        this.errors = [];
    }

    getQueue() {
        return this.queue;
    }

    /**
     * It checks that all the jobs has been completed
     * @param {Function} resolve Promise's callback
     */
    isFinished(resolve) {
        if (this.jobsCompleted === this.totalJobs) {
            this.queue.close();
            resolve({
                jobsCompleted: this.jobsCompleted,
                totalFiles: this.totalFiles,
                errors: this.errors,
                musicFiles: this.totalMusicFiles, // not-empty just if keepInMemory is true
            });
        }
    }

    /**
     * It checks if a file has already been scanned in the past by looking
     * the comment ID3 metatag
     * @param {Object} metadata parsed with music-metadata
     */
    static async isFileTagged(metadata) {
        const { common: { comment } } = metadata;
        return comment.filter((item) => item.startsWith('MusicManager'));
    }

    async storeFile(file) {
        const metadata = await FileMetadata.getMetadata(file);
        const scannerComment = this.isFileTagged(metadata);

        const connection = await getConnection();

        if (scannerComment.length === 1) {
            const inFileMD5 = scannerComment[0].split('-')[1];
            const isDuplicated = await FileDuplicated.isDuplicated(inFileMD5, file);
            if (isDuplicated === true) {
                return;
            }

            File.get()
        }
    }

    async storeFiles(files = []) {
        for (const file of files) {

        }
    }

    /**
     * Main method, in which a worker is dedicated to one directory at a time.
     * The worker (processor.js) returns a list of music files and directories found.
     * For every directory found by every worker, a new job is added to the queue
     */
    async scan() {
        return new Promise((resolve) => {
            this.queue.on('completed', async (job, result) => {
                this.jobsCompleted += 1;

                if (result.error === true) {
                    const { message, stack } = result;
                    this.errors.push({ message, stack });
                } else {
                    this.totalFiles += result.musicFiles.length;

                    if (this.keepInMemory) {
                        result.musicFiles.forEach((element) => this.totalMusicFiles.push(element));
                    } else {
                        await this.storeFiles(result.musicFiles);
                    }

                    for (const resource of result.directories) {
                        this.totalJobs += 1;
                        this.queue.add({ resource });
                    }
                }

                this.isFinished(resolve);
            });

            this.queue.on('error', (error) => {
                this.errors.push(error.message);
                this.jobsCompleted += 1;
                this.isFinished(resolve);
            });

            for (const resource of this.paths) {
                this.queue.add({ resource });
            }
        });
    }
}

module.exports = MusicScanner;
