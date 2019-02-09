const bootstrapApolloServer = require('./libs/apolloServer');
const bootstrapStreamingServer = require('./libs/streamer');

console.time('boostrap');
Promise.all([
    bootstrapApolloServer(),
    bootstrapStreamingServer(),
]).then(() => console.timeEnd('boostrap'));

