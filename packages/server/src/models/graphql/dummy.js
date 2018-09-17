// Graphql doesn't allow empty Query object

export const typeDefs = `
    type Query {
        dummy: Boolean
    }

    type Mutation {
        dummy: Boolean
    }

    type Subscription {
        dummy: Boolean
    }
`;

export const resolvers = {
    Query: {
        dummy(o, args, params) {
            console.log(params);
            return true;
        },
    },
    Mutation: {
        dummy(o, args, params) {
            console.log(params);
            return true;
        },
    },
    Subscription: {
        dummy(o, args, params) {
            console.log(params);
            return true;
        },
    },
};
