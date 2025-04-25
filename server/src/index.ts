import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import typeDefs from "./graphql/typeDefs";

async function startApolloServer() {
  const server = new ApolloServer({ typeDefs });
  const { url } = await startStandaloneServer(server);
  console.log(`
    🚀  Server is running!
    📭  Query at ${url}
  `);
}

startApolloServer();
