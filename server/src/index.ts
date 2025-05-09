import { SECRET } from "../config/env";
import jwt from "jsonwebtoken";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { connectToDatabase } from "./database"; // Import your DB connection function
import { IncomingMessage } from "http";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import Affiliate from "./models/Affiliate";

// Define your custom context type
interface MyContext {
  affiliate?: { id: string; name: string }; // Example: You can define user data in context
}

// Define ApolloServer with your custom context type
const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});

async function startApolloServer() {
  console.log("🟢 Starting server...");
  await connectToDatabase();

  const { url } = await startStandaloneServer(server, {
    context: async ({ req }: { req: IncomingMessage }) => {
      const auth = req.headers.authorization || "";
      let affiliate;

      if (auth.startsWith("Bearer ")) {
        const token = auth.replace("Bearer ", "");
        try {
          const payload = jwt.verify(token, SECRET) as { affiliateId: string };
          // Fetch the full affiliate data from the database using the affiliateId
          affiliate = await Affiliate.findById(payload.affiliateId);
          if (!affiliate) {
            console.warn("⚠️ Affiliate not found in database.");
          }
        } catch (err) {
          console.warn("⚠️ Invalid token:", err);
        }
      }

      return { affiliate };
    },
  });

  console.log(`🚀 Server is running! 📭 Query at ${url}`);
}

startApolloServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
});
