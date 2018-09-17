
import os from 'os';

const BASE_DIR = `${os.homedir()}/pycom/experiments/mp3manager`;

module.exports = {
/**
 * Application configuration section : http://pm2.keymetrics.io/docs/usage/application-declaration/
 * - env: you'll need to use --env <envname> to tell pm2 to use specific environment defined inside a process file
 * - watch: enable watch & restart feature, if a file change in the folder or subfolder, your app will get reloaded
 * - cwd: the directory from which your app will be launched. Mandatory if the app is not in the same folder as this script
 * - ignore_watch: list of regex to ignore some file or folder names by the watch feature
 *
 * Use pm2 conf for log rotate configuration.
 */
    apps: [
        {
            name: 'server',
            script: 'npm',
            args: 'start',
            watch: ['./'],
            watch_options: {
                cwd: `${BASE_DIR}/packages/server`,
            },
            wait_ready: true,
            ignore_watch: ['node_modules', '__test__'],
            kill_timeout: 3000,
            max_restarts: 3,
            cwd: `${BASE_DIR}/packages/server`,
            log_date_format: 'YYYY-MM-DD HH:mm:ss',
            env: {
                PROCESS_FILE: 'mp3manager_server',
                NODE_ENV: 'development',
                DEBUG_COLORS: 'true',
            },
            source_map_support: true,
        },
    ],
};
