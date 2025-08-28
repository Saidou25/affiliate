// src/routes/stripeWebhook.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import Affiliate from "../models/Affiliate";
import AffiliateSale from "../models/AffiliateSale";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export default async function stripeWebhook(req: Request, res: Response) {
  console.log("🔔 Received webhook call...");
  const sig = req.headers["stripe-signature"] as string | undefined;
  const ua = (req.headers["user-agent"] || "").toString();

  // Fast-exit for non-Stripe or obviously invalid requests
  if (!sig || !sig.includes("t=") || !sig.includes("v1=") || !/Stripe/i.test(ua)) {
    console.log("🛡️ Non-Stripe probe or missing/invalid signature. UA:", ua, "Sig:", sig);
    // You can use 200 to keep external monitors quiet, or 400 to be strict.
    return res.status(200).send("ok");
  }

  let event: Stripe.Event;
  try {
    console.log("🔑 Verifying Stripe signature...");
    // IMPORTANT: req.body must be the raw buffer (see server setup below)
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Signature verified.");
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // --- Handle events ---
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("💰 payment_intent.succeeded", pi.id);
        // ... your business logic
        break;
      }
      // add other cases you use:
      // "charge.succeeded", "checkout.session.completed", etc.
      default:
        console.log("ℹ️ Unhandled event type:", event.type);
    }
  } catch (e: any) {
    console.error("🧨 Handler error:", e?.message || e);
    // 500 means Stripe will retry (good if your handler hiccuped)
    return res.status(500).send("handler error");
  }

  return res.status(200).send("success");
}
