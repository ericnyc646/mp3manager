const mariadb = require('mariadb');
const config = require('../config/getConfig');

const pool = mariadb.createPool(config.db);
/**
 * Returns a connection of the pool
 * @returns {Promise} a connection
 */
module.exports = function getConnection() {
    return pool.getConnection()
        .then((conn) => conn)
        .catch((e) => {
            console.error(e);
            return null;
        });
};
