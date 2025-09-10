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

export default async function stripeWebhook(req: Request, res: Response) {
  console.log("🔔 Received webhook call...");
  const sig = req.headers["stripe-signature"] as string | undefined;
  const ua = String(req.headers["user-agent"] || "");

  // Allow Stripe + Stripe CLI only. Soft-ignore noise.
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

        // 1) Find our Payment doc created by the resolver (transactionId == tr_...)
        const payment = await Payment.findOne({ transactionId: t.id });
        if (!payment) {
          console.warn("[WH] No Payment matched transfer id; metadata:", t.metadata);
          break;
        }

        // 2) Mark linked sales paid (only move from unpaid/processing → paid)
        const upd = await AffiliateSale.updateMany(
          { _id: { $in: payment.saleIds }, commissionStatus: { $in: ["unpaid", "processing"] } },
          { $set: { commissionStatus: "paid", paidAt: new Date(), paymentId: payment._id } }
        );
        console.log(`[WH] sales updated to paid: matched=${upd.matchedCount ?? (upd as any).n} modified=${upd.modifiedCount ?? (upd as any).nModified}`);

        // 3) If any sales transitioned, append a confirmed history entry and decrement unpaid pool
        if ((upd.modifiedCount ?? (upd as any).nModified ?? 0) > 0) {
          // Push to history only if this transfer not already present
          const existing = await Affiliate.findOne({
            _id: payment.affiliateId,
            paymentHistory: { $elemMatch: { transactionId: t.id } },
          }).lean();

          if (!existing) {
            await Affiliate.updateOne(
              { _id: payment.affiliateId },
              {
                $inc: { totalCommissions: -Number(payment.paidCommission || 0) },
                $push: {
                  paymentHistory: {
                    saleAmount: payment.saleAmount,
                    paidCommission: payment.paidCommission,
                    productName: payment.productName ?? "Commission payout",
                    date: new Date(), // confirmed at webhook time
                    method: payment.method,
                    transactionId: t.id,
                    notes: payment.notes,
                  },
                },
              }
            );
            console.log("[WH] affiliate history appended & totals decremented.");
          } else {
            console.log("[WH] history already contains this transfer; skipping push/inc.");
          }
        } else {
          console.log("[WH] no sale state changed (probably already paid); skipping history/inc.");
        }

        // (Optional) store a status field on Payment if your schema allows it
        // await Payment.updateOne({ _id: payment._id }, { $set: { status: "succeeded" } });

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

        // If you want to reflect reversals, do the inverse:
        const payment = await Payment.findOne({ transactionId: t.id });
        if (!payment) break;

        const upd = await AffiliateSale.updateMany(
          { _id: { $in: payment.saleIds }, commissionStatus: "paid" },
          { $set: { commissionStatus: "reversed" }, $unset: { paidAt: 1 } }
        );
        console.log(`[WH] sales set to reversed: modified=${upd.modifiedCount ?? (upd as any).nModified}`);

        if ((upd.modifiedCount ?? (upd as any).nModified ?? 0) > 0) {
          // refund the unpaid pool and append a reversal record
          await Affiliate.updateOne(
            { _id: payment.affiliateId },
            {
              $inc: { totalCommissions: Number(payment.paidCommission || 0) },
              $push: {
                paymentHistory: {
                  saleAmount: -payment.saleAmount,
                  paidCommission: -(payment.paidCommission ?? payment.saleAmount),
                  productName: `Reversal: ${payment.productName ?? "Commission payout"}`,
                  date: new Date(),
                  method: payment.method,
                  transactionId: `${t.id}-reversed`,
                  notes: `Stripe reversed transfer ${t.id}${reason ? ` (${reason})` : ""}`,
                },
              },
            }
          );
        }

        // (Optional) mark payment as reversed if your schema has a field for that
        // await Payment.updateOne({ _id: payment._id }, { $set: { status: "reversed" } });
        break;
      }

      case "transfer.updated": {
        const t = event.data.object as Stripe.Transfer;
        console.log(`[WH] transfer.updated tr=${t.id} desc="${t.description}"`);
        // Optional: sync description/metadata->Payment.notes if you care
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
        // You can store payout info on the connected account if desired.
        break;
      }

      // ---------- FYI ----------
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
    // 500 lets Stripe retry on transient errors.
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
