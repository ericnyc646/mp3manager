const Queue = require('bull');
const os = require('os');
const path = require('path');
const _ = require('underscore');
const config = require('../../config/getConfig');

class MusicScanner {
    constructor(options) {
        if (_.isEmpty(options) || _.isEmpty(options.paths)) {
            throw new Error('You must specify the `paths` property');
        }
        const { paths, workers, queueName } = options;

        this.paths = paths;
        this.workers = workers || os.cpus().length;
        this.queueName = queueName || 'music queue';
        this.queue = new Queue('music queue', { redis: config.redis });
        this.queue.process('*', this.workers, path.join(__dirname, 'processor.js'));

        this.jobsCompleted = 0;
        this.totalFiles = 0;
        this.errors = [];
    }

    getQueue() {
        return this.queue;
    }

    isFinished(resolve) {
        if (this.jobsCompleted === this.paths.length) {
            this.queue.close();
            resolve({
                jobsCompleted: this.jobsCompleted,
                totalFiles: this.totalFiles,
                errors: this.errors,
            });
        }
    }

    async scan() {
        return new Promise((resolve) => {
            this.queue.on('completed', (job, result) => {
                this.jobsCompleted += 1;
                if (result.error === true) {
                    const { message, stack } = result;
                    this.errors.push({ message, stack });
                } else {
                    this.totalFiles += result.resources.length;
                    this.isFinished(resolve);
                }
            });

            this.queue.on('error', (error) => {
                this.errors.push(error.message);
                this.jobsCompleted += 1;
                this.isFinished(resolve);
            });

            for (const directory of this.paths) {
                this.queue.add({ directory });
            }
        });
    }
}

module.exports = MusicScanner;
