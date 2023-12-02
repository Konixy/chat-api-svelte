import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageDisabled } from '@apollo/server/plugin/disabled';
import { makeExecutableSchema } from '@graphql-tools/schema';
import typeDefs from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import { config } from 'dotenv';
import Express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';
import type { GraphQLContext, Session, SubscriptionContext } from './lib/types';
import { PrismaClient } from '@prisma/client';
import morgan from 'morgan';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { PubSub } from 'graphql-subscriptions';

const app = Express();

const httpServer = http.createServer(app);

config();

/**
 * Logging
 */
// app.use(morgan("dev"));

const prisma = new PrismaClient();
const pubsub = new PubSub();

async function context({ req, res }: { req: Request; res: Response }): Promise<GraphQLContext> {
  async function getSession(): Promise<Session | null> {
    console.log(req.headers.cookie);
    const { data } = await axios.get<Session>(process.env.NEXTAUTH_URL + '/api/auth/session', {
      headers: { Cookie: req.headers.cookie },
    });
    return data;
  }
  return { session: await getSession(), prisma, pubsub };
}

async function main() {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql/ws',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx: SubscriptionContext): Promise<GraphQLContext> => {
        if (ctx.connectionParams && ctx.connectionParams.session) {
          const { session } = ctx.connectionParams;

          return { session, prisma, pubsub };
        }
        return { session: null, prisma, pubsub };
      },
    },
    wsServer,
  );

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageDisabled(),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();

  app.use(
    '/graphql',
    cors<cors.CorsRequest>({
      origin: process.env.CLIENT_ORIGIN,
      credentials: true,
    }),
    bodyParser.json(),
    expressMiddleware(server, { context }),
  );

  httpServer.listen(process.env.PORT, undefined, () => {
    console.log(`🚀  Server ready at: ${process.env.URL}:${process.env.PORT}`);
  });
}

main();
