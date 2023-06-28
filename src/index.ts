import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import { makeExecutableSchema } from "@graphql-tools/schema";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import { config } from "dotenv";
import Express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import bodyParser from "body-parser";
import axios from "axios";
import type { GraphQLContext, Session } from "./lib/types";
import { PrismaClient } from "@prisma/client";

const app = Express();

const httpServer = http.createServer(app);

config();

const prisma = new PrismaClient();

async function context({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<GraphQLContext> {
  async function getSession(): Promise<Session | null> {
    const { data } = await axios.get<Session>(
      process.env.NEXTAUTH_URL + "/api/auth/session",
      {
        headers: { Cookie: req.headers.cookie },
      }
    );
    return data;
  }
  return { session: await getSession(), prisma };
}

async function main() {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const server = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      ApolloServerPluginLandingPageDisabled(),
    ],
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>({
      origin: process.env.CLIENT_ORIGIN,
      credentials: true,
    }),
    bodyParser.json(),
    expressMiddleware(server, { context })
  );

  httpServer.listen(process.env.PORT, undefined, () => {
    console.log(`🚀  Server ready at: ${process.env.URL}:${process.env.PORT}`);
  });
}

main();
