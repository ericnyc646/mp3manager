const crypto = require('crypto');
const fs = require('fs');
const _ = require('underscore');
const { Readable } = require('stream');
const { promisify } = require('util');
const { getConnection } = require('../../libs/pool');

const getStats = promisify(fs.stat);
/**
 * It calculates the hash of a file
 * @param {string} hashName type of hash (md5, sha1, etc)
 * @param {string|Stream} file a file's path or a readable stream
 * if it's been already opened somewhere else
 */
function getFileHash(hashName, file) {
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
 * It models the "file" table.
 */
class File {
    static get TABLE_NAME() {
        return 'file';
    }

    /**
     * Inserts a new file, calculating the hashes
     * @param {Object} params fields to be saved inside the table
     */
    static async insert(params) {
        const { name, path } = params;

        const stream = fs.createReadStream(path);

        const result = await Promise.all([
            getFileHash('md5', stream),
            getStats(path),
        ]);
        const [md5_hash, stat] = result;
        const { atime, mtime, size } = stat;
        const connection = await getConnection();

        if (_.isNull(connection)) {
            return {};
        }

        try {
            return connection.query(
                {
                    namedPlaceholders: true,
                    sql: `INSERT INTO ${File.TABLE_NAME}
                        (name, atime, mtime, size, path, md5_hash)
                        VALUES (:name, :atime, :mtime, :size, :path, :md5_hash)`,
                },
                { name, atime, mtime, size, path, md5_hash },
            );
        } finally {
            connection.end();
        }
    }
    /**
     * Deletes a single file
     * @param {int} fileId integer identifier
     */
    static async delete(fileId) {
        const connection = await getConnection();

        if (_.isNull(connection)) {
            return {};
        }

        try {
            return connection.query(
                {
                    namedPlaceholders: true,
                    sql: `DELETE FROM ${File.TABLE_NAME} WHERE id = :id`,
                },
                { fileId },
            );
        } finally {
            connection.end();
        }
    }
    /**
     * It retrieves music file
     * @param {Object} params can contains many fields:
     * `fields` as array or string, like `id, name` or `[id, name]`, default `*`
     * `conditions` must be a string, default `1=1`
     * `pagination` an object with `limit` and `offset`
     * `sorting` has a `column` and `direction` fields
     */
    static async get(params) {
        let chosenFields = '*';
        let chosenConditions;
        let chosenLimit;
        let chosenSorting;

        const { fields, conditions, namedPlaceholders, pagination, sorting } = params;

        if (!_.isEmpty(fields)) {
            chosenFields = _.isArray(fields) ? fields.join(',') : fields;
        }

        if (!_.isEmpty(conditions) && _.isString(conditions)) {
            chosenConditions = conditions;
        }

        if (!_.isEmpty(sorting)) {
            const { column, direction } = sorting;

            if (!_.isEmpty(column)) {
                chosenSorting = column;
            }

            if (!_.isEmpty(direction) && !_.isEmpty(column)) {
                chosenSorting += ` ${direction}`;
            }
        }

        if (!_.isEmpty(pagination)) {
            const { limit, offset } = pagination;
            const theLimit = parseInt(limit, 10);
            const theOffset = parseInt(offset, 10);

            if (_.isNumber(theLimit) && theLimit >= 0) {
                chosenLimit = `LIMIT ${theLimit}`;
            }

            if (_.isNumber(theOffset)) {
                chosenLimit += `OFFSET ${theOffset}`;
            }
        }

        const connection = await getConnection();

        if (_.isNull(connection)) {
            return {};
        }

        let sql = `SELECT ${chosenFields} FROM ${File.TABLE_NAME} `;
        if (!_.isEmpty(chosenConditions)) {
            sql += chosenConditions;
        }

        if (!_.isEmpty(chosenSorting)) {
            sql += chosenSorting;
        }

        if (!_.isEmpty(chosenLimit)) {
            sql += chosenLimit;
        }

        try {
            return connection.query(
                {
                    namedPlaceholders: true,
                    sql,
                },
                namedPlaceholders,
            );
        } finally {
            connection.end();
        }
    }
}

module.exports = {
    getFileHash,
    File,
};
