const util = require('util');
const childProcess = require('child_process');
const _ = require('underscore');
require('colors');

const MusicScanner = require(`${__dirname}/../../packages/server/src/libs/scanner`);

const exec = util.promisify(childProcess.exec);

/**
 * Application used by the `mm` CLI. It just calls `run` inside of the
 * script, which automatically calls the proper method
 */
class App {
    constructor(options) {
        const {
            env, user: rootUser, password: rootPass, host = 'localhost',
            command, recreateDb, verbose, dryRun,
            paths,
        } = options;
        this.env = env;
        this.host = host; // database host (install command)

        // we use a privileged user just for the install command, for the rest
        // we use the dedicated user created with initUsers method
        if (command === 'install') {
            this.user = rootUser; // privileged user
            this.password = rootPass; // privileged user
        } else {
            const config = require(`${__dirname}/../../packages/server/src/config/config.${this.env}.js`);
            const { host: optionHost, user, password } = config.db;
            this.user = user;
            this.password = password;
            this.host = optionHost;
        }

        this.recreateDb = recreateDb; // to destroy or not the db before scanning (scan command)
        this.dryRun = dryRun; // to keep in memory or not the music files (scan command)
        this.paths = paths;
        this.command = command;
        this.connection = null;
        this.verbose = verbose;
    }

    /**
     * Run one of the methods beloging to this class, using the command
     * parameter passed by `mm`
     * @returns {Promise} it returns the response of the corresponding command executed
     */
    run() {
        try {
            return this[`${this.command}`]();
        } catch (e) {
            console.error(`Run failed for ${this.command}: ${e.message}`);
            return false;
        } finally {
            this.end();
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
            console.error('runShellCommand has failed', e);
            return { stdout: e.stdout, stderr: e.stderr };
        }
    }

    /**
     * Scans the directories passed as parameter
     */
    async scan() {
        if (this.recreateDb) {
            console.log(`Recreating DB for ${this.env}`);

            // This process assumes that the mp3admin user has already been created.
            // if this is not the case, please use install command before.
            const resDb = await this.initdb();
            if (!resDb) {
                return null;
            }
        }

        const scanner = new MusicScanner({
            keepInMemory: this.dryRun,
            paths: this.paths,
        });

        return scanner.scan();
    }

    /**
     * It creates the users and the database. If they already exist, they'll
     * be dropped. */
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

        return mariadb.createConnection({
            user: this.user,
            host: this.host,
            password: this.password,
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
            console.error('initUsers failed', e);
            return false;
        }
    }

    /**
     * It drops and recreates the music database for a particular environment.
     * If the database has never been created, it relies on a MariaDB account with privileges
     * for creating users and database (default `root`)
     * @returns {Promise<boolean>} true if the database has been successfully created, false otherwise
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
            const command = `mysql -u${this.user} -p${this.password} -D${musicDbName} < ${tablesFile}`;

            const { stdout, stderr } = await App.runShellCommand(command);

            if (_.isEmpty(stdout) && _.isEmpty(stderr)) {
                return true;
            }

            if (!_.isEmpty(stderr)) {
                if (stderr.includes('Using a password on the command line interface can be insecure')) {
                    return true;
                }
            }

            console.error('initdb', stdout, stderr);
            return false;
        } catch (e) {
            console.error('initdb', e);
            return false;
        }
    }

    /**
     * Clear the resources
     */
    end() {
        if (!_.isEmpty(this.connection)) {
            this.connection.end();
        }
    }
}

module.exports = App;
