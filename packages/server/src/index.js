const bootstrapApolloServer = require('./libs/apolloServer');

console.time('boostrap');
bootstrapApolloServer()
    .then(() => console.timeEnd('boostrap'))
    .catch((e) => console.error(e));
