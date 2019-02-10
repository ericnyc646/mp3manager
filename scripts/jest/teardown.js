const { pool } = require('../../packages/server/src/libs/pool');

module.exports = async function teardown() {
    pool.end();
};
