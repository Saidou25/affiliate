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
    // req.body is a Buffer because server.ts mounts bodyParser.raw() on this route
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log("✅ Signature verified successfully.");
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log(`📦 Event received: ${event.type}`);

  // ✅ Woo/Stripe (no Checkout Session): write on payment_intent.succeeded
  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;

    // Pull refId from PI metadata (fallback to charge metadata)
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

    // Resolve affiliate + commission
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

    // Idempotent upsert by paymentIntentId
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

    console.log("🧾 Sale upserted", {
      saleId: String(sale._id),
      refId,
      total,
      commissionEarned,
      paymentIntentId,
    });

    return res.status(200).json({ received: true });
  }

  // Your existing Checkout Session logging (kept as-is)
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log("✅ Checkout session completed:");
    console.log("🆔 Session ID:", session.id);
    console.log("💰 Amount total:", session.amount_total);
    console.log("💵 Currency:", session.currency);
    console.log("👤 Customer Email:", session.customer_details?.email);

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id
      );
      console.log("🛒 Line items retrieved:", lineItems.data.length);

      lineItems.data.forEach((item, index) => {
        console.log(`📦 Item ${index + 1}:`);
        console.log("   🏷️ Name:", item.description);
        console.log("   🔢 Quantity:", item.quantity);
        console.log("   💵 Price (unit):", item.price?.unit_amount);
        console.log("   💰 Total amount:", item.amount_total);
        console.log("   💵 Currency:", item.currency);
      });
    } catch (lineItemErr: any) {
      console.error("❌ Failed to retrieve line items:", lineItemErr.message);
    }
  }

  return res.json({ received: true });
}
