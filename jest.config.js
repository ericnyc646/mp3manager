/* Jest file configuration.
 * It keeps package.json cleaner and permits to load
 * ES6 setup/teardown scripts before/after the tests by using
 * babel config file */
const { readFileSync } = require('fs');

const babelConfig = JSON.parse(readFileSync('./.babelrc', 'utf8'));

require('babel-register')(babelConfig);
require('babel-polyfill');

const { join } = require('path');

const ROOT = `${process.cwd()}`;
const SERVER_ENV = join(ROOT, '/packages/server/__tests__');

module.exports = {
    verbose: true,
    automock: false,
    testMatch: [
        join(SERVER_ENV, '/src/**/*.test.js'),
    ],
    testEnvironment: 'node',
};
