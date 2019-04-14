const Queue = require('bull');
const os = require('os');
const path = require('path');
const _ = require('underscore');
const fs = require('fs');
const { promisify } = require('util');
const File = require('../../models/db/File');
const FileDuplicated = require('../../models/db/FileDuplicated');
const FileMetadata = require('../../models/db/FileMetadata');
const EyeD3 = require('../eyeD3');
const config = require('../../config/getConfig');
const logger = require('../logger');

const getStats = promisify(fs.stat);
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
        logger.debug('Music scanner options', options);
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
            logger.info('Music Scanner', {
                phase: 'finished',
                totalFiles: this.totalFiles,
                errors: this.errors,
            });
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
     * @returns {Array<String>} an one-length array with the MusicScanner's comment or an empty
     * array
     */
    static getScannerComment(comment) {
        if (_.isEmpty(comment) || !_.isArray(comment)) {
            return [];
        }
        return comment.filter((item) => item.startsWith('MusicManager'));
    }

    /**
     * It stores all the info about a file, its metadata and mark it as
     * scanned. If the insert
     * @param {String} fileName file's name
     * @param {String} filePath file's path
     * @returns {Promise<Object|Boolean>} true if the entire process goes well (no errors of any kind,
     * duplicates are considered errors), otherwise an object containing the error's details
     */
    static async insertAllData(fileName, filePath) {
        if (_.isEmpty(fileName) || _.isEmpty(filePath)) {
            throw new Error(`
                MusicScanner.insertAllData: you've passed an empty parameter:
                fileName: ${_.isEmpty(fileName)}, filePath: ${_.isEmpty(filePath)}
            `);
        }

        return File.insert({ name: fileName, path: filePath })
            .then(async (result) => {
                const { error, duplicated, md5_hash } = result;
                logger.debug('Music scanner', {
                    phase: 'insertAllData',
                    step: 'insert',
                    result,
                });
                if (duplicated) {
                    const res = await FileDuplicated.insert({
                        md5_hash, path: filePath,
                    });

                    logger.info('Music scanner', {
                        phase: 'insertAllData',
                        message: 'File duplicated',
                        path: filePath,
                        md5: md5_hash,
                    });
                    res.isDuplicated = true;
                    return res;
                }

                // we store metadata only if the insert was successful
                // TODO: consider to allow to pass metadata to upsert, so we avoid to parse twice
                // the same file
                if (!error) {
                    const res = await FileMetadata.upsert(filePath, md5_hash);
                    logger.info('Music scanner', {
                        phase: 'insert',
                        step: 'metadata upsert',
                        path: filePath,
                        md5: md5_hash,
                    });
                    res.isDuplicated = false;
                    return res;
                }

                return error;
            })
            .then(async (result) => {
                const { isDuplicated, error } = result;
                // we tag the file only if the insert was successful
                if (!error && !isDuplicated) {
                    await EyeD3.markFileAsScanned(filePath);
                    logger.info('Music scanner', {
                        phase: 'post tagging',
                        path: filePath,
                    });
                    return true;
                }

                return result;
            })
            .catch((e) => {
                logger.error('Music scanner', {
                    phase: 'insertAllData',
                    message: e.message,
                    path: filePath,
                });
                return false;
            });
    }

    /**
     * It compares two dates
     * @param {Date} d1 first date
     * @param {Date} d2 second date
     * @returns {Boolean} true if they're equal (or both null), false otherwise
     */
    static areDatesEqual(d1, d2) {
        logger.debug('Comparing dates', { d1, d2 });
        if (_.isEmpty(d1) && _.isEmpty(d2)) {
            return true;
        }

        if (_.isEmpty(d1) || _.isEmpty(d2)) {
            return false;
        }

        return d1.getTime() === d2.getTime();
    }

    /**
     * This is the function which has the core logic for dealing with all the possible
     * cases (file moved/renamed, content or metadata changed, etc)
     * @param {String} file file's path
     * @returns {Promise<Object|Boolean>} true if the entire process goes well (no errors of any kind,
     * duplicates are considered errors), otherwise an object containing the error's details
     */
    static async storeFile(file) {
        const metadata = await FileMetadata.getMetadata(file);
        const fileName = path.basename(file, path.extname(file));
        let scannerComment = [];

        if (metadata && metadata.comment) {
            scannerComment = MusicScanner.getScannerComment(metadata.comment);
        }

        logger.debug('Music scanner', {
            phase: 'store file: before checking md5',
            path: file,
            scannerComment,
            fileName,
        });

        if (!_.isEmpty(scannerComment)) {
            const inFileMD5 = scannerComment[0].split('-')[1];
            const isDuplicated = await FileDuplicated.isDuplicated(inFileMD5, file);
            logger.debug('Music scanner', {
                phase: 'md5 found, previously saved',
                path: file,
                inFileMD5,
                isDuplicated,
            });

            if (isDuplicated === true) {
                return false;
            }

            const data = await File.getFileAndMetadata(inFileMD5);
            if (_.isEmpty(data)) {
                logger.warn(`File ${file} [${inFileMD5}] is tagged but absent from the db!`);
                return MusicScanner.insertAllData(fileName, file);
            }

            const {
                name, atime, mtime, size, path: thePath, md5_hash, // file table
                bitrate, sample_rate, number_of_channels, codec_profile,
                encoder, duration, acoustid_id, comment, album, artist, date,
                genre, isrc, label, language, lyricist, media, musicbrainz_workid,
                musicbrainz_albumid, musicbrainz_recordingid, musicbrainz_artistid,
                musicbrainz_albumartistid, musicbrainz_releasegroupid, musicbrainz_trackid,
                originaldate, originalyear, has_picture, releasecountry,
                title, track, writer, year,
            } = data;

            const { atime: atimeFile, mtime: mtimeFile, size: sizeFile } = await getStats(file);
            const nameChanged = fileName !== name;
            const aTimeChanged = !this.areDatesEqual(atimeFile, atime);
            const mTimeChanged = !this.areDatesEqual(mtimeFile, mtime);
            const sizeChanged = size !== sizeFile;
            const pathChanged = thePath !== file;

            if (nameChanged || aTimeChanged || mTimeChanged || sizeChanged || pathChanged) {
                await File.update({
                    atime: atimeFile, mtime: mtimeFile, size: sizeFile,
                    path: file, md5_hash, name: fileName,
                });
                logger.debug('Music scanner', {
                    phase: 'file table upsert',
                    nameChanged, aTimeChanged, mTimeChanged, sizeChanged, pathChanged,
                });
            }

            if (metadata.bitrate !== bitrate || metadata.sample_rate !== sample_rate
                || metadata.number_of_channels !== number_of_channels || metadata.codec_profile !== codec_profile
                || metadata.encoder !== encoder || metadata.duration !== duration
                || metadata.acoustid_id !== acoustid_id || metadata.comment !== comment
                || metadata.album !== album || metadata.artist !== artist
                || metadata.date !== date || metadata.genre !== genre || metadata.isrc !== isrc
                || metadata.label !== label || metadata.language !== language || metadata.lyricist !== lyricist
                || metadata.media !== media || metadata.musicbrainz_workid !== musicbrainz_workid
                || metadata.musicbrainz_albumid !== musicbrainz_albumid
                || metadata.musicbrainz_recordingid !== musicbrainz_recordingid
                || metadata.musicbrainz_artistid !== musicbrainz_artistid
                || metadata.musicbrainz_albumartistid !== musicbrainz_albumartistid
                || metadata.musicbrainz_releasegroupid !== musicbrainz_releasegroupid
                || metadata.musicbrainz_trackid !== musicbrainz_trackid
                || metadata.originaldate !== originaldate || metadata.originalyear !== originalyear
                || metadata.has_picture !== has_picture || metadata.releasecountry !== releasecountry
                || metadata.title !== title || metadata.track !== track || metadata.writer !== writer
                || metadata.year !== year) {
                await FileMetadata.upsert(file, inFileMD5);
                logger.debug('Music scanner', {
                    phase: 'filemetadata table upsert',
                });
            }

            return true;
        }
        
        return MusicScanner.insertAllData(fileName, file);
    }

    static async storeFiles(files = []) {
        const promises = [];
        for (const file of files) {
            promises.push(MusicScanner.storeFile(file));
        }
        return Promise.all(promises);
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
