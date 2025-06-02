
import dotenv from "dotenv";
import path from "path";

// Decide which env file to load based on NODE_ENV
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(__dirname, "../", envFile) });
// import * as jwt from "jsonwebtoken";
import { createContext, MyContext } from "./context";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { connectToDatabase } from "./database"; // Import  DB connection function
// import { IncomingMessage } from "http";
import { SECRET } from "./config/env";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
// import Affiliate from "./models/Affiliate";

// Define your custom context type
// interface MyContext {
//   affiliate?: { id: string; name: string }; // Example: You can define user data in context
// }

// const SECRET = process.env.SECRET;

if (!SECRET) {
  throw new Error("JWT SECRET is not defined in environment variables");
}

// function verifyToken(token: string) {
//   try {
//     return jwt.verify(token, SECRET);
//   } catch (err: any) {
//     if (err.name === "TokenExpiredError") {
//       console.warn("⚠️ Token expired at:", err.expiredAt);
//       return null;
//     }
//     console.warn("⚠️ Invalid token:", err.message);
//     return null;
//   }
// }

// Define ApolloServer with your custom context type
const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
});

async function startApolloServer() {
  console.log("🟢 Starting server...");
  await connectToDatabase();

  const { url } = await startStandaloneServer(server, {
   context: createContext as any,
  });

  console.log(`🚀 Server is running! 📭 Query at ${url}`);
}

startApolloServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
});

