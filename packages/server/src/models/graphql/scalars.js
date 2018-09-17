const types = require('./commonTypes');

const { DateTime, GraphQLJSON } = types;

export const typeDefs = `
    scalar DateTime
    scalar GraphQLJSON
`;

export const resolvers = {
    DateTime,
    GraphQLJSON,
};
