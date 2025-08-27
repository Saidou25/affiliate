import dotenv from "dotenv";
import path from "path";

// Load env
const envFile = process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(__dirname, "../", envFile) });

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import { createContext, MyContext } from "./context";
import { connectToDatabase } from "./database";
import { SECRET } from "./config/env";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";

import ordersRoute from "./routes/orders";
import stripeWebhook from "./routes/stripeWebhook";

// Models used by Woo ingest
import Affiliate from "./models/Affiliate";
import AffiliateSale from "./models/AffiliateSale";

if (!SECRET) {
  throw new Error("JWT SECRET is not defined in environment variables");
}

async function startServer() {
  console.log("🟢 Starting Apollo + Webhook server...");
  await connectToDatabase();

  const app = express();

  // ⚠️ Stripe webhook MUST use raw body and be registered BEFORE any JSON parser
  app.post(
    "/api/stripe/webhook",
    bodyParser.raw({ type: "application/json" }),
    stripeWebhook
  );

  // ✅ CORS for frontend
  app.use(
    cors({
      origin: "*",
      credentials: true,
    })
  );

  // 🔐 Woo ingest: JSON parser + API key guard (scoped to /api/woo/*)
  app.use(
    "/api/woo",
    express.json({ limit: "1mb" }),
    (req, res, next) => {
      const apiKey = req.header("x-api-key");
      if (!apiKey || apiKey !== process.env.WOO_INGEST_KEY) {
        return res.status(401).json({ ok: false, error: "Unauthorized" });
      }
      next();
    }
  );

  // 📥 Woo → Affiliate ingest endpoint (idempotent upsert by source+orderId)
  app.post("/api/woo/order", async (req, res) => {
    try {
      const p = req.body as any;

      // minimal validation
      if (!p?.orderId || !p?.orderNumber || !p?.orderDate || typeof p.total !== "number") {
        return res.status(400).json({ ok: false, error: "Bad payload" });
      }

      // resolve affiliate (optional if refId not present)
      let affiliateId: any = null;
      if (p.refId) {
        const aff = await Affiliate.findOne({ refId: p.refId }).select("_id");
        if (aff) affiliateId = aff._id;
      }

      const sale = await AffiliateSale.findOneAndUpdate(
        { source: "woocommerce", orderId: String(p.orderId) },
        {
          $set: {
            refId: p.refId ?? null,
            affiliateId,
            orderNumber: String(p.orderNumber),
            orderDate: new Date(p.orderDate),
            status: String(p.status || "processing"),
            currency: String(p.currency || "USD"),
            subtotal: Number(p.subtotal || 0),
            discount: Number(p.discount || 0),
            tax: Number(p.tax || 0),
            shipping: Number(p.shipping || 0),
            total: Number(p.total || 0),
            paymentIntentId: p.paymentIntentId ?? null,
            items: Array.isArray(p.items) ? p.items : [],
            product: p.product ?? null,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { new: true, upsert: true }
      );

      return res.json({ ok: true, saleId: String(sale._id) });
    } catch (err) {
      console.error("woo/order ingest error", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  });

  // Other REST routes
  app.use("/api", ordersRoute);

  // ✅ Apollo Server (GraphQL)
  const server = new ApolloServer<MyContext>({ typeDefs, resolvers });
  await server.start();

  // JSON parser AFTER the Stripe raw route
  app.use(
    "/graphql",
    bodyParser.json(),
    expressMiddleware(server, { context: createContext as any })
  );

  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}/graphql`);
    console.log(`✅ Webhook ready at http://localhost:${PORT}/api/stripe/webhook`);
    console.log(`📥 Woo ingest at http://localhost:${PORT}/api/woo/order`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
});
