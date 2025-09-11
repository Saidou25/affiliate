// server.ts
import dotenv from "dotenv";
import path from "path";

// Load env
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
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

  // Render / Cloudflare can be behind proxies
  app.set("trust proxy", true);

  // ——————————————————————————————————————————————————————————
  // 1) STRIPE WEBHOOK — must receive RAW BODY and be mounted
  //    BEFORE any JSON/body parser touches the request.
  // ——————————————————————————————————————————————————————————
  app.post(
    "/api/stripe/webhook",
    bodyParser.raw({ type: "application/json" }),
    stripeWebhook
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ——————————————————————————————————————————————————————————
  // 2) CORS (tight but permissive enough); handle preflight
  // ——————————————————————————————————————————————————————————
  app.use(
    cors({
      origin: "*", // adjust to your frontend origin(s) if you want to lock down
      credentials: false,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-api-key",
        "Stripe-Signature",
        "x-site-key",
      ],
    })
  );
  // app.options("*", cors());
  app.options(/.*/, cors()); // OK with path-to-regexp v6
  // // or
  // app.options("(.*)", cors());

  // Simple healthcheck (useful for Render)
  app.get("/healthz", (_req, res) =>
    res.status(200).json({ ok: true, uptime: process.uptime() })
  );

  // ——————————————————————————————————————————————————————————
  // 3) WOO INGEST — scoped JSON parser and API key guard
  // ——————————————————————————————————————————————————————————
  app.use("/api/woo", express.json({ limit: "1mb" }), (req, res, next) => {
    const apiKey = req.header("x-api-key");
    if (!apiKey || apiKey !== process.env.WOO_INGEST_KEY) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    next();
  });

  // 📥 Woo → Affiliate ingest endpoint (idempotent upsert by source+orderId)
  app.post("/api/woo/order", async (req, res) => {
    try {
      const p = req.body as any;

      // ——— helpers ———
      const num = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      const DEFAULT_RATE = 0.1;

      // Compute commission base (prefer line items → subtotal-discount → total-tax-shipping)
      const computeCommissionBase = (payload: any) => {
        if (Array.isArray(payload.items) && payload.items.length) {
          const lines = payload.items.reduce((acc: number, it: any) => {
            // accept both your normalized shape and raw Woo fields
            const lineTotal = num(it.lineTotal ?? it.total ?? it.line_total);
            if (lineTotal) return acc + lineTotal;
            const unit = num(it.unitPrice ?? it.price);
            const qty = num(it.qty ?? it.quantity ?? 1);
            return acc + unit * qty;
          }, 0);
          const orderDiscount = num(payload.discount ?? payload.discount_total);
          return Math.max(0, lines - orderDiscount);
        }

        const subtotal = num(p.subtotal);
        const discount = num(p.discount ?? p.discount_total);
        if (subtotal || discount) return Math.max(0, subtotal - discount);

        const total = num(p.total);
        const tax = num(p.tax ?? p.total_tax);
        const shipping = num(p.shipping ?? p.shipping_total);
        return Math.max(0, total - tax - shipping);
      };

      // ——— minimal validation ———
      if (
        !p?.orderId ||
        !p?.orderNumber ||
        !p?.orderDate ||
        typeof p.total !== "number"
      ) {
        return res.status(400).json({ ok: false, error: "Bad payload" });
      }

      // Resolve affiliate + pick rate (payload override → affiliate → default)
      let affiliateId: any = null;
      if (p.refId) {
        const aff = await Affiliate.findOne({ refId: p.refId }).select(
          "_id commissionRate"
        );
        if (aff) affiliateId = aff._id;
      }
      const rateOverride = num(p.meta?.commissionRate);
      const affiliateRate = num(
        (await Affiliate.findOne({ refId: p.refId }).select("commissionRate"))
          ?.commissionRate
      );
      const commissionRate = rateOverride || affiliateRate || DEFAULT_RATE;

      // Compute commission
      const base = computeCommissionBase(p);
      const commissionEarned = Math.round(base * commissionRate * 100) / 100;

      // Normalize a few fields
      const orderId = String(p.orderId);
      const orderNumber = String(p.orderNumber);
      const orderDate = new Date(p.orderDate);

      // Normalize items to your stored shape (keeps your current field names)
      const items = Array.isArray(p.items)
        ? p.items.map((it: any) => ({
            wooProductId: num(it.wooProductId ?? it.product_id),
            name: it.name,
            qty: num(it.qty ?? it.quantity),
            unitPrice: num(it.unitPrice ?? it.price),
            lineTotal: num(it.lineTotal ?? it.total ?? it.line_total),
          }))
        : [];

      // Upsert idempotently by (source, orderId)
      const sale = await AffiliateSale.findOneAndUpdate(
        { source: "woocommerce", orderId },
        {
          $set: {
            source: "woocommerce",
            orderId,
            refId: p.refId ?? null,
            affiliateId,
            orderNumber,
            orderDate,
            status: String(p.status || "processing"),
            currency: String(p.currency || "USD"),
            subtotal: num(p.subtotal || 0),
            discount: num(p.discount || p.discount_total || 0),
            tax: num(p.tax || p.total_tax || 0),
            shipping: num(p.shipping || p.shipping_total || 0),
            total: num(p.total || 0),
            paymentIntentId: p.paymentIntentId ?? p.payment_intent_id ?? null,
            items,
            product: p.product ?? items[0]?.name ?? null,

            // 🔹 snapshot and persist the commission math
            commissionRate,
            commissionEarned,

            updatedAt: new Date(),
          },
          $setOnInsert: {
            event: "purchase",
            title: "purchase",
            createdAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          strictQuery: false,
          strict: false,
        }
      );

      // Optional debug
      console.log("[woo/order] upserted", {
        orderId,
        refId: p.refId,
        base,
        commissionRate,
        commissionEarned,
      });

      return res.json({ ok: true, saleId: String(sale._id), commissionEarned });
    } catch (err) {
      console.error("woo/order ingest error", err);
      return res.status(500).json({ ok: false, error: "Server error" });
    }
  });

  // Other REST routes (mounted after Woo guard)
  app.use("/api", ordersRoute);

  // ——————————————————————————————————————————————————————————
  // 4) GRAPHQL — JSON parser AFTER the Stripe raw route
  // ——————————————————————————————————————————————————————————
  const server = new ApolloServer<MyContext>({ typeDefs, resolvers });
  await server.start();

  app.use(
    "/graphql",
    // bodyParser.json(),
    express.json(),
    expressMiddleware(server, { context: createContext as any })
  );

  // ——————————————————————————————————————————————————————————
  // 5) START
  // ——————————————————————————————————————————————————————————
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
    console.log(
      `✅ Stripe webhook at http://localhost:${PORT}/api/stripe/webhook`
    );
    console.log(`📥 Woo ingest at http://localhost:${PORT}/api/woo/order`);
  });
}

startServer().catch((err) => {
  console.error("❌ Server failed to start:", err);
});
