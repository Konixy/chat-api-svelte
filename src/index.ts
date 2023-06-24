import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { makeExecutableSchema } from "@graphql-tools/schema";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import { config } from "dotenv";

config();

async function main() {
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const server = new ApolloServer({
    schema,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(process.env.PORT) },
  });

  console.log(`🚀  Server ready at: ${url}`);
}

main();
