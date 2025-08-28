// src/routes/stripeWebhook.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import Affiliate from "../models/Affiliate";
import AffiliateSale from "../models/AffiliateSale";

/**
 * ENV:
 * - STRIPE_SECRET_KEY
 * - STRIPE_WEBHOOK_SECRET
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

// --------- tiny helpers ----------
const safe = (v: any) => {
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
};

const iso = (secs?: number | null) =>
  secs ? new Date(secs * 1000).toISOString() : "n/a";

export default async function stripeWebhook(req: Request, res: Response) {
  const startedAt = Date.now();
  console.log("🧲 [WH] Entered stripeWebhook");
  console.log("🧾 [WH] Headers:", safe(req.headers));
  console.log(
    "🧵 [WH] Raw body length:",
    (req.body as Buffer)?.length ?? "n/a"
  );

  // 1) Verify signature
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    console.error("❌ [WH] Missing stripe-signature header");
    return res.status(400).send("Missing Stripe signature");
  }

  let event: Stripe.Event;
  try {
    console.log("🔑 [WH] Verifying Stripe signature...");
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log(
      "✅ [WH] Signature OK. event.id:",
      event.id,
      "type:",
      event.type,
      "created:",
      iso(event.created)
    );
  } catch (err: any) {
    console.error("❌ [WH] Signature verification failed:", err?.message);
    return res.status(400).send(`Webhook Error: ${err?.message}`);
  }

  // 2) Log the whole event (trimmed for safety)
  try {
    console.log(
      "📦 [WH] Event summary:",
      safe({
        id: event.id,
        type: event.type,
        created: iso(event.created),
        livemode: (event as any).livemode,
      })
    );
  } catch (e) {
    console.log("ℹ️ [WH] Unable to summarize event:", e);
  }

  // 3) Handle interesting event types
  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        console.log("💰 [WH] Handling payment_intent.succeeded");
        const pi = event.data.object as Stripe.PaymentIntent;

        // Dump key fields for debugging
        console.log("🧩 [PI] id:", pi.id);
        console.log(
          "🧩 [PI] amount_received (cents):",
          pi.amount_received,
          "currency:",
          pi.currency
        );
        console.log("🧩 [PI] customer:", safe(pi.customer));
        console.log("🧩 [PI] latest_charge:", safe(pi.latest_charge));
        console.log("🧩 [PI] metadata:", safe(pi.metadata));

        // Extract metadata (from Woo)
        const refId = (pi.metadata?.refId || "").trim();
        const wooOrderId = (
          pi.metadata?.woo_order_id ||
          pi.metadata?.order_id ||
          ""
        ).trim();
        const wooOrderNumber = (pi.metadata?.woo_order_number || "").trim();
        const customerEmail =
          (
            pi.metadata?.customer_email ||
            (pi as any).receipt_email ||
            ""
          ).trim() || undefined;
        const amountCents = pi.amount_received ?? 0;
        const amountDollars = Number((amountCents / 100).toFixed(2));
        const currency = (pi.currency || "usd").toLowerCase();

        console.log("🏷️ [META] refId:", refId);
        console.log(
          "🏷️ [META] wooOrderId:",
          wooOrderId,
          "wooOrderNumber:",
          wooOrderNumber
        );
        console.log("🏷️ [META] customerEmail:", customerEmail);
        console.log(
          "💵 [AMT] amountCents:",
          amountCents,
          "amountDollars:",
          amountDollars,
          "currency:",
          currency
        );

        // Basic guards
        if (!refId) {
          console.error(
            "❗ [WH] Missing refId in metadata. Cannot attribute sale. Aborting DB write."
          );
          break; // Exit switch but still 200 OK to Stripe to avoid retries
        }

        if (amountCents <= 0) {
          console.error("❗ [WH] Non-positive amount. Aborting DB write.");
          break;
        }

        // Fetch affiliate
        console.log("🔎 [DB] Looking up Affiliate by refId:", refId);
        const affiliate = await Affiliate.findOne({ refId }).lean();
        console.log("🧾 [DB] Affiliate lookup result:", safe(affiliate));

        if (!affiliate) {
          console.error(
            "❗ [DB] No Affiliate matched refId:",
            refId,
            "— cannot attribute commission."
          );
          // Still record the sale document (unattributed) so we can reconcile later
          console.log(
            "📝 [DB] Upserting unattributed AffiliateSale for audit trail"
          );
          const upsert = await AffiliateSale.findOneAndUpdate(
            { externalPaymentIntentId: pi.id },
            {
              $setOnInsert: {
                externalPaymentIntentId: pi.id,
                status: "succeeded",
                currency,
                createdAt: new Date(),
              },
              $set: {
                amount: amountDollars, // note: dollars
                amountCents,
                refId,
                wooOrderId,
                wooOrderNumber,
                customerEmail,
                description: pi.description,
                eventId: event.id,
              },
            },
            { new: true, upsert: true }
          );
          console.log("✅ [DB] Unattributed sale upserted:", safe(upsert));
          break;
        }

        // Compute commission (defaults to 10% if missing)
        const commissionRate: number = Number(affiliate.commissionRate ?? 0.1);
        const commissionDollars = Number(
          (amountDollars * commissionRate).toFixed(2)
        );
        const commissionCents = Math.round(amountCents * commissionRate);

        console.log("📈 [CALC] commissionRate:", commissionRate);
        console.log(
          "📈 [CALC] commissionCents:",
          commissionCents,
          "commissionDollars:",
          commissionDollars
        );

        // Idempotency: we upsert on payment_intent id so replays don’t duplicate
        console.log(
          "📝 [DB] Upserting AffiliateSale (by externalPaymentIntentId)..."
        );
        const saleDoc = await AffiliateSale.findOneAndUpdate(
          { externalPaymentIntentId: pi.id },
          {
            $setOnInsert: {
              externalPaymentIntentId: pi.id,
              createdAt: new Date(),
            },
            $set: {
              status: "succeeded",
              currency,
              amount: amountDollars,
              amountCents,
              commissionEarned: commissionDollars,
              commissionEarnedCents: commissionCents,
              refId,
              affiliateId: affiliate._id, // if your schema uses affiliate or affiliateId, adjust name here
              wooOrderId,
              wooOrderNumber,
              customerEmail,
              description: pi.description,
              eventId: event.id,
            },
          },
          { new: true, upsert: true }
        );
        console.log("✅ [DB] AffiliateSale upserted:", safe(saleDoc));

        // Update Affiliate totals (in dollars to match your model examples)
        console.log("🔧 [DB] Updating Affiliate totals...");
        const inc: Record<string, number> = {
          totalSales: amountDollars,
          totalCommissions: commissionDollars,
        };
        // If you also track counts:
        // inc.totalOrders = 1;

        const updatedAffiliate = await Affiliate.findByIdAndUpdate(
          affiliate._id,
          { $inc: inc },
          { new: true }
        );
        console.log("✅ [DB] Affiliate updated:", safe(updatedAffiliate));

        break;
      }

      default: {
        // Not used right now, but keep a breadcrumb
        console.log(
          "↪️ [WH] Unhandled event type — no DB action taken:",
          event.type
        );
        break;
      }
    }
  } catch (handlerErr: any) {
    console.error(
      "💥 [WH] Handler error:",
      handlerErr?.message,
      handlerErr?.stack
    );
    // We still return 200 so Stripe does not hammer retries if the error is on our side,
    // but during debugging you might temporarily return 500 to see replay behavior.
  }

  const ms = Date.now() - startedAt;
  console.log(`🏁 [WH] Done. Ack to Stripe. Duration: ${ms}ms`);
  // Always acknowledge so Stripe doesn't retry forever (we're idempotent anyway)
  return res.json({ received: true });
}
