const { pool } = require('../../packages/server/src/libs/pool');

module.exports = async function teardown() {
    console.log('Closing pool...');
    pool.end();
};
