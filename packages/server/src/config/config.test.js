module.exports = {
    backend: {
        apiPort: 4666, // graphql server
        streamingPort: 4667, // streaming server
    },
    frontend: {
        url: 'http://localhost',
        webSocketPort: 4668,
    },
    apiIntegration: { // shared properties between integrations
        userAgent: 'mp3manager/voodoo81people@gmail.com',
    },
    db: {
        socketPath: '/var/run/mysqld/mysqld.sock',
        user: 'mp3admin_test',
        password: 'musictest',
        database: 'mp3manager_test',
        connectionLimit: 5,
    },
    redis: {
        port: 6379,
        host: '127.0.0.1',
        family: 4,
        /* password: 'auth', */
        db: 1,
    },
};
