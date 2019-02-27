const fs = require('fs');
const _ = require('underscore');
const { promisify } = require('util');
const { getConnection } = require('../../libs/pool');
const { scanner: { batchSize } } = require('../../config/getConfig');
const { mp3hash } = require('../../libs/utils');
const DbModel = require('./DbModel');

const getStats = promisify(fs.stat);

/**
 * It models the "file" table.
 */
class File extends DbModel {
    static get TABLE_NAME() {
        return 'file';
    }

    /**
     * Inserts multiple files at once
     * @param {Array} files Array of objects which each of them represents a file
     * @returns {Number} the number of affected rows
     */
    static async batchInsert(files) {
        const connection = await getConnection();

        if (_.isNull(connection)) {
            return {};
        }

        const batchSql = {
            namedPlaceholders: true,
            sql: `INSERT INTO ${File.TABLE_NAME}
                   (name, atime, mtime, size, path, md5_hash)
                  VALUES (:name, :atime, :mtime, :size, :path, :md5_hash)`,
        };
        let values = [];
        const promises = [];

        for (const file of files) {
            if (values.length === batchSize) {
                // no nested object so it results in a deep copy
                const sqlValues = Object.assign([], values);
                promises.push(connection.batch(batchSql, sqlValues));
                values = [];
            }

            const { name, path } = file;
            // eslint-disable-next-line
            const result = await Promise.all([
                mp3hash(path),
                getStats(path),
            ]);
            const [md5_hash, stat] = result;
            const { atime, mtime, size } = stat;

            values.push({
                name, atime, mtime, size, path, md5_hash,
            });
        }

        if (!_.isEmpty(values)) {
            promises.push(connection.batch(batchSql, values));
        }

        const res = await Promise.all(promises);
        return res.reduce((accumulator, currentValue) => 
            accumulator + currentValue.affectedRows, 0);
    }

    /**
     * Inserts a new file, calculating the hashes
     * @param {Object} params fields to be saved inside the table
     */
    static async insert(params) {
        const { name, path } = params;
        const result = await Promise.all([
            mp3hash(path),
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
     * `conditions` must be a string (optional)
     * `pagination` an object with `limit` and `offset` (optional)
     * `sorting` has a `column` and `direction` fields (optional)
     */
    static async get(params) {
        let chosenFields = '*';
        let chosenConditions;
        let chosenLimit;
        let chosenSorting;

        const { fields, where, namedPlaceholders, pagination, sorting } = params;

        if (!_.isEmpty(fields)) {
            chosenFields = _.isArray(fields) ? fields.join(',') : fields;
        }

        if (!_.isEmpty(where) && _.isString(where)) {
            chosenConditions = where;
        }

        if (!_.isEmpty(sorting)) {
            const { column, direction } = sorting;

            if (!_.isEmpty(column)) {
                chosenSorting = column;
            }

            if (!_.isEmpty(direction) && !_.isEmpty(column)) {
                chosenSorting += ` ORDER BY ${direction}`;
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
            sql += ` WHERE ${chosenConditions}`;
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

module.exports = File;
