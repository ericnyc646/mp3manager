export default {
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
        socketPath: '/tmp/maria.sock',
        user: 'mp3admin',
        password: 'eR85/!sP$plO=',
        database: 'mp3manager',
        connectionLimit: 5,
    },
};
