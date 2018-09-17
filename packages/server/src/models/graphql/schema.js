import { makeExecutableSchema } from 'graphql-tools';
import { mergeTypes, mergeResolvers } from 'merge-graphql-schemas';
import { resolvers as scalarsResolvers, typeDefs as scalarsTypeDefs } from './scalars';
// TODO: remove this as soon as you've something real
import { resolvers as dummyResolvers, typeDefs as dummyTypeDefs } from './dummy';

const schemaDefinition = `
  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;

const resolvers = [scalarsResolvers, dummyResolvers];
const types = [schemaDefinition, scalarsTypeDefs, dummyTypeDefs];

export default makeExecutableSchema({
    typeDefs: mergeTypes(types),
    resolvers: mergeResolvers(resolvers),
});
