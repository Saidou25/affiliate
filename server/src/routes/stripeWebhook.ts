// src/routes/stripeWebhook.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import Affiliate from "../models/Affiliate";
import AffiliateSale from "../models/AffiliateSale";
import Payment from "../models/Payment";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// IMPORTANT (server.ts):
// app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhook);
// Make sure ANY body parser (json/urlencoded) does NOT run on this route.

export default async function stripeWebhook(req: Request, res: Response) {
  console.log("🔔 Received webhook call...");
  const sig = req.headers["stripe-signature"] as string | undefined;
  const ua = String(req.headers["user-agent"] || "");

  // Allow Stripe + Stripe CLI. Soft-ignore noise (bots, curls without signature).
  if (!sig || !sig.includes("t=") || !sig.includes("v1=") || !/^Stripe\//i.test(ua)) {
    console.log("🛡️ Ignored non-Stripe probe. UA:", ua);
    return res.status(200).send("ok");
  }

  let event: Stripe.Event;
  try {
    console.log("🔑 Verifying Stripe signature...");
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Signature verified.");
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logEventHeader(event);

  try {
    switch (event.type) {
      // ---------- TRANSFERS (platform → connected account) ----------
      case "transfer.created": {
        const t = event.data.object as Stripe.Transfer;
        console.log(
          `[WH] transfer.created tr=${t.id} amount=${(t.amount / 100).toFixed(2)} ${t.currency} ` +
          `dest=${t.destination} created=${iso(t.created)} acct=${event.account ?? "-"}`
        );

        // Link to your Payment doc and mark sales as paid if not already handled by the mutation.
        const payment = await Payment.findOne({ transactionId: t.id });
        if (payment) {
          // idempotent updates
          await Payment.updateOne(
            { _id: payment._id },
            { $set: { /* status: "succeeded" (optional) */ } }
          );

          // Mark linked sales paid (defensive: only those not yet paid)
          await AffiliateSale.updateMany(
            { _id: { $in: payment.saleIds }, commissionStatus: { $ne: "paid" } },
            { $set: { commissionStatus: "paid", paidAt: new Date(), paymentId: payment._id } }
          );

          // Append snapshot to Affiliate.paymentHistory (also done in resolver, but safe if webhook arrives first)
          await Affiliate.findByIdAndUpdate(payment.affiliateId, {
            $push: {
              paymentHistory: {
                saleAmount: payment.saleAmount,
                paidCommission: payment.paidCommission,
                productName: payment.productName,
                date: new Date(),
                method: payment.method,
                transactionId: t.id,
                notes: payment.notes,
              },
            },
          });
        } else {
          // Optional: use t.metadata.saleIds/refId as a fallback to locate records if needed
          const meta = (t.metadata ?? {}) as any;
          console.log("[WH] transfer.created has metadata:", meta);
        }
        break;
      }

      case "transfer.reversed": {
        const t = event.data.object as Stripe.Transfer;
        const reason =
          (t.reversals?.data?.[0] as any)?.reason ??
          (t.reversals?.data?.[0] as any)?.metadata?.reason ??
          "n/a";
        console.log(
          `[WH] transfer.reversed tr=${t.id} amount=${(t.amount / 100).toFixed(2)} ${t.currency} reason=${reason}`
        );
        // Optional: mark Payment as reversed and adjust sales if you support reversals.
        break;
      }

      case "transfer.updated": {
        const t = event.data.object as Stripe.Transfer;
        console.log(`[WH] transfer.updated tr=${t.id}`);
        // Optional: sync metadata/description if you rely on it.
        break;
      }

      // ---------- PAYOUTS (connected account → bank) ----------
      case "payout.created":
      case "payout.updated":
      case "payout.canceled":
      case "payout.failed":
      case "payout.paid": {
        const p = event.data.object as Stripe.Payout;
        console.log(
          `[WH] ${event.type} po=${p.id} amount=${(p.amount / 100).toFixed(2)} ${p.currency} ` +
          `status=${p.status} arrival=${p.arrival_date ? iso(p.arrival_date) : "n/a"} acct=${event.account ?? "-"}`
        );
        // Optional: if you ever store payoutId on Payment, update "bankStatus" here.
        break;
      }

      // ---------- FYI: you can log PI success if you need it ----------
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        console.log("💰 payment_intent.succeeded", pi.id);
        break;
      }

      default:
        console.log("ℹ️ Unhandled event type:", event.type);
        break;
    }

    return res.status(200).send("success");
  } catch (e: any) {
    console.error("🧨 Handler error:", e?.message || e);
    // 500 prompts Stripe to retry, which is what you want on transient issues.
    return res.status(500).send("handler error");
  }
}

function logEventHeader(event: Stripe.Event) {
  const acct = event.account ? ` acct=${event.account}` : "";
  console.log(`[WH] ▶︎ Event id=${event.id} type=${event.type}${acct}`);
}

function iso(unixSeconds?: number) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : "n/a";
}
