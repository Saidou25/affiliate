// server.ts
// ─────────────────────────────────────────────────────────────────────────────
// Bootstraps Express + Apollo Server (v4) with Stripe webhook + Woo ingest.
// Key ordering rules:
//   1) Stripe webhook must receive RAW body (no JSON parsing before it).
//   2) Each JSON-using route should mount its own parser (scoped), not global.
//   3) Apollo (/graphql) must have express.json() BEFORE expressMiddleware.
// ─────────────────────────────────────────────────────────────────────────────

import path from "path";
import dotenv from "dotenv";
// at the top of server.ts
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";

// Load env file early (production vs dev)
const envFile =
  process.env.NODE_ENV === "production" ? ".env.production" : ".env";
dotenv.config({ path: path.resolve(__dirname, "../", envFile) });

import express from "express";
import cors from "cors";
// Prefer Express' built-in raw/json parsers. No need for 'body-parser' package.
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";

import { createContext, MyContext } from "./context";
import { connectToDatabase } from "./database";
import { SECRET } from "./config/env";
import typeDefs from "./graphql/typeDefs";
import resolvers from "./graphql/resolvers";

import ordersRoute from "./routes/orders";
import stripeWebhook from "./routes/stripeWebhook";

// Models referenced in Woo ingest
import Affiliate from "./models/Affiliate";
import AffiliateSale from "./models/AffiliateSale";
import { startOnboardingReminderCron } from "./jobs/onboardingReminders";

if (!SECRET) {
  throw new Error("JWT SECRET is not defined in environment variables");
}

async function startServer() {
  console.log("🟢 Starting Apollo + Webhook server...");
  await connectToDatabase();

  const app = express();

  // If you’re behind a proxy (Render, Cloudflare, Nginx), preserve client IPs, etc.
  app.set("trust proxy", true);

  // 🔎 Build tag probe (temporary)
  const BUILD_TAG = "server-build-" + new Date().toISOString();
  app.get("/__whoami", (_req, res) => res.send(BUILD_TAG));
  // ───────────────────────────────────────────────────────────────────────────
  // 1) STRIPE WEBHOOK — MUST SEE RAW BODY
  //    Keep this BEFORE any JSON/body parser touches the request.
  //    Stripe signs the exact raw bytes; JSON parsing would break verification.
  // ───────────────────────────────────────────────────────────────────────────
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }), // <- raw body only for this route
    stripeWebhook
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 2) CORS — Apply after webhook (webhook doesn't need CORS)
  //    If you want to lock origins, replace "*" with your frontend URL(s).
  // ───────────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: "*",
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
  // Handle all preflight OPTION requests
  app.options(/.*/, cors());

  // ───────────────────────────────────────────────────────────────────────────
  // 3) WOO INGEST — SCOPE JSON PARSER + API KEY GUARD
  //    We mount express.json() ONLY for /api/woo so it doesn’t affect webhook.
  // ───────────────────────────────────────────────────────────────────────────
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

      // ── helpers ──
      const num = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      const DEFAULT_RATE = 0.1;

      // Compute commission base:
      // prefer line items → subtotal - discount → total - tax - shipping
      const computeCommissionBase = (payload: any) => {
        if (Array.isArray(payload.items) && payload.items.length) {
          const lines = payload.items.reduce((acc: number, it: any) => {
            const lineTotal = num(it.lineTotal ?? it.total ?? it.line_total);
            if (lineTotal) return acc + lineTotal;
            const unit = num(it.unitPrice ?? it.price);
            const qty = num(it.qty ?? it.quantity ?? 1);
            return acc + unit * qty;
          }, 0);
          const orderDiscount = num(payload.discount ?? payload.discount_total);
          return Math.max(0, lines - orderDiscount);
        }

        const subtotal = num(payload.subtotal);
        const discount = num(payload.discount ?? payload.discount_total);
        if (subtotal || discount) return Math.max(0, subtotal - discount);

        const total = num(payload.total);
        const tax = num(payload.tax ?? payload.total_tax);
        const shipping = num(payload.shipping ?? payload.shipping_total);
        return Math.max(0, total - tax - shipping);
      };

      // Minimal payload validation (adjust as needed)
      if (
        !p?.orderId ||
        !p?.orderNumber ||
        !p?.orderDate ||
        typeof p.total !== "number"
      ) {
        return res.status(400).json({ ok: false, error: "Bad payload" });
      }

      // Resolve affiliate (if any) and choose commission rate
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

      // Do the math
      const base = computeCommissionBase(p);
      const commissionEarned = Math.round(base * commissionRate * 100) / 100;

      // Normalize some fields
      const orderId = String(p.orderId);
      const orderNumber = String(p.orderNumber);
      const orderDate = new Date(p.orderDate);

      // Normalize items to stored shape
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
            // snapshot commission
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

  // Other REST routes (these can use their own parsers internally as needed)
  app.use("/api", ordersRoute);

  // ───────────────────────────────────────────────────────────────────────────
  // 4) GRAPHQL — SCOPE JSON PARSER ON /graphql BEFORE expressMiddleware
  //    Do NOT mount a global express.json() above; keep it localized here.
  // ───────────────────────────────────────────────────────────────────────────
  const server = new ApolloServer<MyContext>({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
  });

  await server.start();

  app.all("/graphql", (req, res, next) => {
    if (process.env.NODE_ENV === "production" && req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method Not Allowed" });
    }
    next();
  });

  // 1) Hard-block non-JSON POSTs
  app.post("/graphql", (req, res, next) => {
    const ct = req.headers["content-type"] || "";
    if (!ct.startsWith("application/json")) {
      console.warn("[/graphql 415]", req.method, ct);
      return res
        .status(415)
        .json({ ok: false, error: "Unsupported Media Type" });
    }
    next();
  });

  app.use(
    "/graphql",
    // Optional: log content-type to debug "req.body not set" issues
    (req, _res, next) => {
      if (req.method === "POST") {
        console.log("GraphQL hit:", req.headers["content-type"]);
      }
      next();
    },
    (req, _res, next) => {
      console.log(
        "[/graphql pre-parse]",
        "method=",
        req.method,
        "content-type=",
        req.headers["content-type"]
      );
      next();
    },
    // ensure req.body is at least an empty object for GET/OPTIONS/etc.
    (req, _res, next) => {
      if (req.body === undefined) (req as any).body = {};
      next();
    },

    cors({ origin: "*", credentials: false }),
    express.urlencoded({ extended: false }),
    // Guard A: handle preflight here so Apollo never sees OPTIONS
    (req, res, next) => {
      if (req.method === "OPTIONS") return res.sendStatus(204);
      next();
    },

    // Guard B: reject non-JSON POSTs early (helps pinpoint offender)
    (req, res, next) => {
      if (req.method === "POST" && !req.is("application/json")) {
        console.warn(
          "[/graphql] Non-JSON POST blocked:",
          req.headers["content-type"]
        );
        return res
          .status(415)
          .json({ ok: false, error: "Unsupported Media Type" });
      }
      next();
    },

    express.json({ limit: "1mb", type: "application/json" }), // ensures req.body exists for Apollo

    expressMiddleware(server, { context: createContext as any })
  );

  // start daily reminders (09:05 America/New_York by default)
  startOnboardingReminderCron();

  // ───────────────────────────────────────────────────────────────────────────
  // 5) START SERVER
  // ───────────────────────────────────────────────────────────────────────────
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
