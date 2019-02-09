const App = require('../cli/App');
const config = require('../../packages/server/src/config/config.test');

module.exports = async function setup() {
    const { user, password, socketPath } = config.db;
    return new App({
        env: 'test',
        command: 'initdb',
        user,
        password,
        socketPath,
    }).run();
};
