import express from 'express';
import bodyParser from 'body-parser';
import { execute, subscribe } from 'graphql';
import { ApolloServer } from 'apollo-server-express';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import cors from 'cors';
import http from 'http';
import config from './config';
import schema from './models/graphql/schema';

const app = express();
app.use(cors({ credentials: true, origin: config.frontendURL }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const httpServer = http.createServer();

httpServer.listen(config.frontend.webSocketPort, '0.0.0.0', () =>
    new SubscriptionServer({
        execute,
        subscribe,
        schema,
        onConnect: async (connectionParams) => {
            console.log(connectionParams);
            return {};
        },
    }, {
        server: httpServer,
        path: '/subscriptions',
    }));

const server = new ApolloServer({
    debug: true,
    schema,
    formatError: (err) => { console.error(err); return err; },
});

server.applyMiddleware({ app });
app.listen({ port: config.port }, () => console.info(`🚀 Server ready at http://localhost:${config.port}${server.graphqlPath}`));
