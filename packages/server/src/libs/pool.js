const mariadb = require('mariadb');
const config = require('../config/getConfig');

const pool = mariadb.createPool(config.db);

/**
 * It gets a connection from the Pool
 * @returns {Promise<Connection>} A Connection instance.
 * @see https://mariadb.com/kb/en/library/connector-nodejs-promise-api/#connection-api
 */
function getConnection() {
    return pool.getConnection()
        .then((conn) => conn)
        .catch((e) => {
            console.error(e);
            return null;
        });
}

/**
 * Returns the count of the connections grouped by their status
 * @returns {Object} an object with the connections grouped by active/idle
 */
function showPoolInfo() {
    const active = pool.activeConnections();
    const idle = pool.idleConnections();
    const total = pool.totalConnections();

    return {
        active, idle, total,
    };
}

/**
 * Returns a connection of the pool
 * @returns {Promise} a connection
 */
module.exports = {
    getConnection,
    showPoolInfo,
    pool,
};
