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
const JEST_ENV = join(ROOT, 'test');
console.log(`JEST_ENV: ${JEST_ENV}`);
module.exports = {
    verbose: true,
    automock: false,
    testMatch: [join(JEST_ENV, '/src/**/*.test-app.js')],
    testURL: 'http://localhost:3003',
    // globalSetup: join(JEST_ENV, '/libs/setup.js'),
    testEnvironment: 'node',
};
