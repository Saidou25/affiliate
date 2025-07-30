
// import dotenv from "dotenv";
// import path from "path";

// // Decide which env file to load based on NODE_ENV
// const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
// dotenv.config({ path: path.resolve(__dirname, "../", envFile) });
// // import * as jwt from "jsonwebtoken";
// import { createContext, MyContext } from "./context";
// import { ApolloServer } from "@apollo/server";
// import { startStandaloneServer } from "@apollo/server/standalone";
// import { connectToDatabase } from "./database"; // Import  DB connection function
// import { SECRET } from "./config/env";
// import typeDefs from "./graphql/typeDefs";
// import resolvers from "./graphql/resolvers";


// if (!SECRET) {
//   throw new Error("JWT SECRET is not defined in environment variables");
// }

// // Define ApolloServer with your custom context type
// const server = new ApolloServer<MyContext>({
//   typeDefs,
//   resolvers,
// });

// async function startApolloServer() {
//   console.log("🟢 Starting server...");
//   await connectToDatabase();

//   const { url } = await startStandaloneServer(server, {
//    context: createContext as any,
//   });

//   console.log(`🚀 Server is running! 📭 Query at ${url}`);
// }

// startApolloServer().catch((err) => {
//   console.error("❌ Server failed to start:", err);
// });




import dotenv from "dotenv";
import path from "path";
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(__dirname, "../", envFile) });
import express from "express";
import bodyParser from "body-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import cors from "cors";

import { createContext, MyContext } from "./context";
import { connectToDatabase } from "./database";
import { SECRET } from "./config/env";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";
import stripeWebhook from "./routes/stripeWebhook";


if (!SECRET) {
  throw new Error("JWT SECRET is not defined in environment variables");
}

async function startApolloServer() {
  console.log("🟢 Starting Express + Apollo server...");
  await connectToDatabase();

  const app = express();

  // ✅ Stripe Webhook - raw body needed
  app.use("/api/stripe/webhook", stripeWebhook);

  // ✅ Apollo GraphQL middleware
  const server = new ApolloServer<MyContext>({ typeDefs, resolvers });
  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: createContext as any,
    })
  );

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}/graphql`);
  });
}

startApolloServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
});
