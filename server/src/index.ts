
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
// // import { IncomingMessage } from "http";
// import { SECRET } from "./config/env";
// import typeDefs from "./graphql/typeDefs";
// import resolvers from "./graphql/resolvers";
// // import Affiliate from "./models/Affiliate";

// // Define your custom context type
// // interface MyContext {
// //   affiliate?: { id: string; name: string }; // Example: You can define user data in context
// // }

// // const SECRET = process.env.SECRET;

// if (!SECRET) {
//   throw new Error("JWT SECRET is not defined in environment variables");
// }

// // function verifyToken(token: string) {
// //   try {
// //     return jwt.verify(token, SECRET);
// //   } catch (err: any) {
// //     if (err.name === "TokenExpiredError") {
// //       console.warn("⚠️ Token expired at:", err.expiredAt);
// //       return null;
// //     }
// //     console.warn("⚠️ Invalid token:", err.message);
// //     return null;
// //   }
// // }

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
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(__dirname, "../", envFile) });
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import bodyParser from "body-parser";
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

async function startServer() {
  console.log("🟢 Starting Apollo + Webhook server...");
  await connectToDatabase();

  const app = express();

  // ✅ CORS for frontend
  app.use(
    cors({
      origin: "*",
      // origin: ["http://localhost:5173", "https://princetongreenpride.org",  "https://princetongreen.org"], // allow your client
      credentials: true,
    })
  );

  // ✅ Stripe webhook (must use raw body)
  app.post(
    "/api/stripe/webhook",
    bodyParser.raw({ type: "application/json" }),
    stripeWebhook
  );

  // ✅ Apollo Server
  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
  });
  await server.start();

  // ✅ JSON middleware AFTER raw (important)
  app.use(
    "/graphql",
    bodyParser.json(),
    expressMiddleware(server, {
      context: createContext as any,
    })
  );

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}/graphql`);
    console.log(`✅ Webhook ready at http://localhost:${PORT}/api/stripe/webhook`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
});
