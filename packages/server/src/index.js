const bootstrapApolloServer = require('./libs/apolloServer');
const bootstrapMongoose = require('./models/db/mongo');

console.time('boostrap');
Promise.all([
    bootstrapMongoose(),
    bootstrapApolloServer(),
]).then(() => console.timeEnd('boostrap'))
    .catch((e) => console.error(e));
