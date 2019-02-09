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
        this.connection = null;
    }

    /**
     * Run one of the methods beloging to this class, using the command
     * parameter passed by `mm`
     */
    run() {
        try {
            return this[`${this.command}`]();
        } catch (e) {
            console.error(`Run failed for ${this.command}: ${e.message}`);
            return false;
        }
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
     * Shortcut for installing creating users ad database. If they already exist, they'll
     * be dropped
     */
    install() {
        return this.initUsers()
            .then((result) => {
                if (result === true) {
                    return this.initdb();
                }

                return false;
            });
    }

    /**
     * @returns a new connection if there isn't a valid existing one or the old valid
     * connection
     */
    async _getConnection() {
        if (!_.isEmpty(this.connection) && this.connection.isValid()) {
            return this.connection;
        }

        const config = require(`${__dirname}/../../packages/server/src/config/config.${this.env}.js`);
        const {
            socketPath,
            database: musicDbName,
        } = config.db;

        return mariadb.createConnection({
            user: this.user,
            socketPath,
            password: this.password,
            database: musicDbName,
        });
    }

    /**
     * It creates al the required users with their privileges
     */
    async initUsers() {
        this.connection = await this._getConnection();
        const config = require(`${__dirname}/../../packages/server/src/config/config.${this.env}.js`);
        const {
            user: musicDbUser,
            password: musicDbPass,
            database: musicDbName,
        } = config.db;

        console.log(`_initUsers for ${musicDbUser}@${musicDbName} [${this.env}]...`);

        try {
            await Promise.all([
                this.connection.query(`DROP USER IF EXISTS '${musicDbUser}'@'127.0.0.1'`),
                this.connection.query(`DROP USER IF EXISTS '${musicDbUser}'@'localhost'`),
            ]);

            await Promise.all([
                this.connection.query(`CREATE USER '${musicDbUser}'@'127.0.0.1' IDENTIFIED BY '${musicDbPass}'`),
                this.connection.query(`CREATE USER '${musicDbUser}'@'localhost' IDENTIFIED BY '${musicDbPass}'`),
            ]);

            await Promise.all([
                this.connection.query(`GRANT ALL ON ${musicDbName}.* TO '${musicDbUser}'@'127.0.0.1'`),
                this.connection.query(`GRANT ALL ON ${musicDbName}.* TO '${musicDbUser}'@'localhost'`),
            ]);

            return true;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * It drops and recreates the music database for a particular environment.
     * It relies on a MariaDB account with privileges for creating users and database (default
     * `root`)
     */
    async initdb() {
        try {
            this.connection = await this._getConnection();
            const config = require(`${__dirname}/../../packages/server/src/config/config.${this.env}.js`);
            const { database: musicDbName } = config.db;

            console.log(`_initdb ${musicDbName} [${this.env}]...`);

            await this.connection.query(`DROP DATABASE IF EXISTS ${musicDbName}`);
            await this.connection.query(`
                CREATE DATABASE ${musicDbName}
                    CHARACTER SET = 'utf8'
                    COLLATE = 'utf8_general_ci';
            `);

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
        }
    }

    /**
     * Clear the resources
     */
    end() {
        if (_.isEmpty(this.connection)) {
            this.connection.end();
        }
    }
}

module.exports = App;
