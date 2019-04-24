module.exports = {
    backend: {
        apiPort: 3666, // graphql server
        streamingPort: 3667, // streaming server
    },
    frontend: {
        url: 'http://localhost',
        webSocketPort: 3668,
    },
    logging: {
        level: 'info',
    },
    scanner: {
        removeAllComments: true, // if to leave or not just MusicManager comment
        batchSize: 100, // how many values to batch insert
    },
    apiIntegration: { // shared properties between integrations
        userAgent: 'mp3manager/voodoo81people@gmail.com',
    },
    // dedicated to mariadb createPool function
    db: {
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
