export default {
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
        socketPath: '/tmp/mariatest.sock',
        user: 'mp3admin',
        password: 'eR85/!sP$plO=',
        database: 'mp3manager_test',
        connectionLimit: 5,
    },
};
