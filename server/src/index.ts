import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { connectToDatabase } from './database';  // Import your DB connection function
import typeDefs from './graphql/typeDefs';
import resolvers from './graphql/resolvers';
import { IncomingMessage } from 'http';

// Define your custom context type
interface MyContext {
  user?: { id: string; name: string };  // Example: You can define user data in context
}

// Define ApolloServer with your custom context type
const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});

// Define the context in startStandaloneServer, not in ApolloServer options
async function startApolloServer() {
  console.log("🟢 Starting server...");
  await connectToDatabase();

  const { url } = await startStandaloneServer(server, {
    context: async ({ req }: { req: IncomingMessage }) => {
      // Simulate user extraction, e.g., from headers
      const user = { id: '123', name: 'Alice' };
      return { user };
    },
  });

  console.log(`🚀 Server is running! 📭 Query at ${url}`);
}

startApolloServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
});
