import bootstrapApolloServer from './libs/apolloServer';
import bootstrapStreamingServer from './libs/streamer';

console.time('boostrap');
Promise.all([
    bootstrapApolloServer(),
    bootstrapStreamingServer(),
]).then(() => console.timeEnd('boostrap'));

