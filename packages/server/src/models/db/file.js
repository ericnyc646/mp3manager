import crypto from 'crypto';
import fs from 'fs';
import { Readable } from 'stream';
import pool from '../../libs/getDbPool';
import AcusticId from '../../libs/AcusticId';

/**
 * It calculates the hash of a file
 * @param {string} hashName type of hash (md5, sha1, etc)
 * @param {string|Stream} file a file's path or a readable stream
 * if it's been already opened somewhere else
 */
export function getFileHash(hashName, file) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash(hashName);
        let stream;

        if (typeof file === 'string') {
            stream = fs.createReadStream(file);
        } else if (file instanceof Readable) {
            stream = file;
        } else {
            throw new Error('Second argument must be a string or a readable stream');
        }

        stream.on('error', (err) => reject(err));
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

/**
 * It models the "file" table
 */
export default class File {
    static get TABLE_NAME() {
        return 'file';
    }

    /**
     * Inserts a new file, calculating the hashes
     * @param {Object} params fields to be saved inside the table
     */
    static async insert(params) {
        const {
            name, atime, mtime, path,
            bitrate, rating,
        } = params;

        const stream = fs.createReadStream(path);
        const result = Promise.all([
            getFileHash('md5', stream),
            AcusticId.getAcusticId(stream),
        ]);
        const [md5_hash, acousticid_hash] = result;

        return pool.query(
            {
                namedPlaceholders: true,
                sql: `INSERT INTO ${File.TABLE_NAME}
                      VALUES (:name, :atime, :mtime, :path,
                              :acousticid_hash, :md5_hash, :bitrate, 
                              :rating)`,
            },
            { name, atime, mtime, path, acousticid_hash, md5_hash, bitrate, rating },
        );
    }
}
