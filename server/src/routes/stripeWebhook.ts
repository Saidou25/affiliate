// src/routes/stripeWebhook.ts
import { Request, Response } from "express";
import Stripe from "stripe";
import Affiliate from "../models/Affiliate";
import AffiliateSale from "../models/AffiliateSale";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export default async function stripeWebhook(req: Request, res: Response) {
  console.log("🔔 Received webhook call...");

  const sig = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;
  try {
    console.log("🔑 Verifying Stripe signature...");
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Signature verified successfully.");
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📦 Event received: ${event.type}`);

  // ————————————————————————————————————————————————————————————————
  // A) Handle CHARGE path (your endpoint currently receives charge.succeeded)
  // ————————————————————————————————————————————————————————————————
  if (event.type === "charge.succeeded") {
    const charge = event.data.object as Stripe.Charge;

    const paymentIntentId =
      (charge.payment_intent as string | null) ?? null;

    // Prefer captured amount; fallback to amount
    const amountCents =
      typeof charge.amount_captured === "number" && charge.amount_captured > 0
        ? charge.amount_captured
        : (charge.amount as number);
    const total = (amountCents || 0) / 100;
    const currency = (charge.currency || "usd").toUpperCase();

    // Try refId from charge.metadata first
    let refId: string | null =
      (charge.metadata && (charge.metadata as any).refId) ||
      (charge.metadata && (charge.metadata as any).ref) ||
      (charge.metadata && (charge.metadata as any).affiliateRef) ||
      null;

    // Optionally pull order number from charge metadata
    const orderNumberRaw =
      (charge.metadata && (charge.metadata as any).woo_order_number) ||
      (charge.metadata && (charge.metadata as any).order_id) ||
      (charge.metadata && (charge.metadata as any).orderNumber) ||
      null;

    // If refId missing but we have a PaymentIntent, fetch its metadata
    if (!refId && paymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
        refId =
          (pi.metadata && (pi.metadata as any).refId) ||
          (pi.metadata && (pi.metadata as any).ref) ||
          (pi.metadata && (pi.metadata as any).affiliateRef) ||
          null;
      } catch (e: any) {
        console.error("⚠️ Could not retrieve PaymentIntent:", e.message);
      }
    }

    // Resolve affiliate & commission
    let affiliateId: any = null;
    let commissionRate = 0;
    if (refId) {
      const aff = await Affiliate.findOne({ refId })
        .select("_id commissionRate")
        .lean();
      if (aff) {
        affiliateId = aff._id;
        commissionRate = Number(aff.commissionRate || 0);
      }
    }
    const commissionEarned = Number((total * commissionRate).toFixed(2));

    // Idempotent upsert keyed by paymentIntentId (fallback to charge.id)
    const idKey = paymentIntentId ?? String(charge.id);

    const sale = await AffiliateSale.findOneAndUpdate(
      { source: "stripe", paymentIntentId: idKey },
      {
        $set: {
          source: "stripe",
          event: "purchase",
          status: "succeeded",
          paymentIntentId: idKey,
          refId,
          affiliateId,
          orderNumber: orderNumberRaw ? String(orderNumberRaw) : null,
          currency,
          total,
          commissionRate,
          commissionEarned,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { new: true, upsert: true }
    );

    console.log("🧾 Sale upserted (charge.succeeded)", {
      saleId: String(sale._id),
      refId,
      total,
      commissionEarned,
      paymentIntentId: idKey,
    });

    return res.status(200).json({ received: true });
  }

  // ————————————————————————————————————————————————————————————————
  // B) Handle PAYMENT INTENT path (kept as-is)
  // ————————————————————————————————————————————————————————————————
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    const refId =
      (pi.metadata?.refId ||
        (pi.metadata as any)?.ref ||
        (pi.metadata as any)?.affiliateRef) ??
      null;

    const paymentIntentId = pi.id;
    const amountReceivedCents =
      typeof pi.amount_received === "number" ? pi.amount_received : 0;
    const total = amountReceivedCents / 100;
    const currency = (pi.currency || "usd").toUpperCase();
    const orderNumber =
      (pi.metadata?.woo_order_number ||
        pi.metadata?.order_id ||
        (pi.metadata as any)?.orderNumber) ??
      null;

    let affiliateId: any = null;
    let commissionRate = 0;
    if (refId) {
      const aff = await Affiliate.findOne({ refId })
        .select("_id commissionRate")
        .lean();
      if (aff) {
        affiliateId = aff._id;
        commissionRate = Number(aff.commissionRate || 0);
      }
    }
    const commissionEarned = Number((total * commissionRate).toFixed(2));

    const sale = await AffiliateSale.findOneAndUpdate(
      { source: "stripe", paymentIntentId },
      {
        $set: {
          source: "stripe",
          event: "purchase",
          status: "succeeded",
          paymentIntentId,
          refId,
          affiliateId,
          orderNumber: orderNumber ? String(orderNumber) : null,
          currency,
          total,
          commissionRate,
          commissionEarned,
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { new: true, upsert: true }
    );

    console.log("🧾 Sale upserted (payment_intent.succeeded)", {
      saleId: String(sale._id),
      refId,
      total,
      commissionEarned,
      paymentIntentId,
    });

    return res.status(200).json({ received: true });
  }

  // ————————————————————————————————————————————————————————————————
  // C) Optional: keep Checkout Session logging (no sale write)
  // ————————————————————————————————————————————————————————————————
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log("✅ Checkout session completed:", {
      sessionId: session.id,
      amount_total: session.amount_total,
      currency: session.currency,
      email: session.customer_details?.email,
    });
    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      console.log("🛒 Line items retrieved:", lineItems.data.length);
    } catch (e: any) {
      console.error("❌ Failed to retrieve line items:", e.message);
    }
  }

  // Acknowledge all other events quickly
  return res.json({ received: true });
}
