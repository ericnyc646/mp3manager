import mariadb from 'mariadb';
import config from '../config/getConfig';

const pool = mariadb.createPool(config.db);

pool.on('connection', (connection) => {
    console.log('DB Connection established');

    connection.on('error', (err) => {
        console.error(new Date(), 'Maria connection error', err.code);
        connection.release();
    });

    connection.on('close', (err) => {
        console.error(new Date(), 'Maria connection closed', err);
        connection.release();
    });
});

export default pool;
