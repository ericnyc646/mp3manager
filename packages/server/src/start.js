import bootstrapApolloServer from './libs/apolloServer';
import bootstrapStreamingServer from './libs/streamer';

// ciaofgfg
console.time('start');
Promise.all([
    bootstrapApolloServer(),
    bootstrapStreamingServer(),
]).then(() => console.timeEnd('start'));

