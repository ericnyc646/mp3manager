module.exports = {
    backend: {
        apiPort: 3666, // graphql server
        streamingPort: 3667, // streaming server
    },
    frontend: {
        url: 'http://localhost',
        webSocketPort: 3668,
    },
    apiIntegration: { // shared properties between integrations
        userAgent: 'mp3manager/voodoo81people@gmail.com',
    },
    db: {
        socketPath: '/var/run/mysqld/mysqld.sock',
        user: 'mp3admin',
        password: 'eR85/!sP$plO=',
        host: '127.0.0.1',
        database: 'mp3manager',
        connectionLimit: 5,
    },
    redis: {
        port: 6379,
        host: '127.0.0.1',
        family: 4,
        /* password: 'auth', */
        db: 0,
    },
};
