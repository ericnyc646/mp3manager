const mariadb = require('mariadb');
const util = require('util');
const childProcess = require('child_process');
const _ = require('underscore');

const exec = util.promisify(childProcess.exec);

/**
 * Application used by the `mm` CLI. It just calls `run` inside of the
 * script, which automatically calls the proper method
 */
class App {
    constructor(options) {
        const { env, user, password, command } = options;
        this.env = env;
        this.user = user;
        this.password = password;
        this.command = command;
    }

    /**
     * Run one of the methods beloging to this class, using the command
     * parameter passed by `mm`
     */
    run() {
        return this[`_${this.command}`]();
    }

    /**
     * It runs a shell command returning stdout and stderr, if any
     * @param  {string} command one or more commands that can be run in a shell
     * @return {object}         stdout and stderr
     */
    static async runShellCommand(command) {
        let stdout;
        let stderr;
        try {
            ({ stdout, stderr } = await exec(command));
            return { stdout, stderr };
        } catch (e) {
            return { stdout: e.stdout, stderr: e.stderr };
        }
    }

    /**
     * It drops and recreates the music database both for test and production environment.
     * It relies on a MariaDB account with privileges for creating users and database (default
     * `root`)
     */
    async _initdb() {
        let connection;
        try {
            const config = require(`${__dirname}/../../packages/server/src/config/config.${this.env}.js`);
            const { host, socketPath, database: musicDbName, password: musicDbPass, user: musicDbUser } = config.db;
            connection = await mariadb.createConnection({
                host,
                user: this.user,
                socketPath,
                password: this.password,
            });

            await connection.query(`DROP DATABASE IF EXISTS ${musicDbName}`);
            await connection.query(`
                CREATE DATABASE ${musicDbName}
                    CHARACTER SET = 'utf8'
                    COLLATE = 'utf8_general_ci';
            `);
            await connection.query(`DROP USER IF EXISTS '${musicDbUser}'@'${host}'`);
            await connection.query(`CREATE USER '${musicDbUser}'@'${host}' IDENTIFIED BY '${musicDbPass}'`);

            const tablesFile = `${__dirname}/../database/tables.sql`;
            const { stdout, stderr } = await App.runShellCommand(`
                mysql -u${this.user} -p${this.password} -D${musicDbName} < ${tablesFile}
            `);

            if (_.isEmpty(stdout) && _.isEmpty(stderr)) {
                return true;
            }

            console.error(stdout, stderr);
            return false;
        } catch (e) {
            console.error(e);
            return false;
        } finally {
            connection.end();
        }
    }
}

module.exports = App;
