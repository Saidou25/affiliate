import Stripe from "stripe";
import { MongoClient, ObjectId } from "mongodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const MONGO = process.env.MONGODB_URI!;
const DB = process.env.DB_NAME || "princetongreen-affiliate";

// --- OPTIONAL FILTERS (adjust if desired) ---
// e.g., only last 90 days: Math.floor(Date.now()/1000) - 60*60*24*90
const CREATED_GTE: number | undefined = undefined;
// Import only $1/$2 charges while you verify
const ALLOWED_AMOUNTS_CENTS: Set<number> | undefined = new Set([100, 200]);

type Affiliate = { _id: ObjectId; refId: string; commissionRate?: number };

function extractOrderId(ch: Stripe.Charge, pi?: Stripe.PaymentIntent) {
  const metaOrder = ch.metadata?.order_id || pi?.metadata?.order_id;
  if (metaOrder != null && String(metaOrder).trim() !== "") return String(metaOrder);

  // Fallback: parse from description like "NEW EARTH STORE - Order 2158"
  const m = (ch.description || "").match(/Order\s+(\d+)/i);
  return m ? m[1] : null;
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.MONGODB_URI) {
    throw new Error("Missing STRIPE_SECRET_KEY or MONGODB_URI env.");
  }

  const mongo = new MongoClient(MONGO);
  await mongo.connect();
  const db = mongo.db(DB);

  const Affiliates = db.collection<Affiliate>("affiliates");
  const Sales = db.collection("affiliatesales");

  // Map refId -> affiliate doc
  const affs = await Affiliates.find({}, { projection: { refId: 1, commissionRate: 1 } }).toArray();
  const byRef = new Map(affs.map(a => [a.refId, a]));

  let after: string | undefined;
  let inserted = 0, skippedExisting = 0, skippedFilter = 0;

  while (true) {
    const page = await stripe.charges.list({
      limit: 100,
      starting_after: after,
      ...(CREATED_GTE ? { created: { gte: CREATED_GTE } } : {}),
      expand: ["data.payment_intent", "data.balance_transaction"],
    });

    if (!page.data.length) break;

    for (const ch of page.data) {
      // Basic filters
      if (!ch.paid) { skippedFilter++; continue; }
      if (ALLOWED_AMOUNTS_CENTS && !ALLOWED_AMOUNTS_CENTS.has(ch.amount)) { skippedFilter++; continue; }

      const pi = typeof ch.payment_intent === "object" ? (ch.payment_intent as Stripe.PaymentIntent) : undefined;

      // Resolve refId (charge first, then PI)
      const refIdRaw = (ch.metadata?.refId || pi?.metadata?.refId || "").trim();
      const refId = refIdRaw || null;

      // Affiliate mapping
      let affiliateId: ObjectId | null = null;
      let commissionRate = 0.10;
      let isDirect = false;
      if (refId && refId.toUpperCase() !== "DIRECT") {
        const aff = byRef.get(refId);
        if (aff?._id) {
          affiliateId = aff._id;
          if (typeof aff.commissionRate === "number") commissionRate = aff.commissionRate;
        }
      } else if (refId && refId.toUpperCase() === "DIRECT") {
        isDirect = true;
      }

      const amount = (ch.amount || 0) / 100; // dollars
      const refunded = ch.refunded || (ch.amount_refunded || 0) > 0;
      const orderId = extractOrderId(ch, pi);

      const commissionEarned = (!isDirect && affiliateId)
        ? +(amount * commissionRate).toFixed(2)
        : 0;

      // Build sale doc to INSERT ONLY (match your existing shape)
      const saleDoc = {
        source: "woocommerce",
        orderId: orderId,
        event: "purchase",
        currency: (ch.currency || "usd").toUpperCase(),
        discount: 0,
        shipping: 0,
        subtotal: amount,
        tax: 0,
        createdAt: new Date(ch.created * 1000),
        updatedAt: new Date(),

        // affiliate linkage
        refId: refId,
        affiliateId: affiliateId,
        commissionRate,
        commissionEarned,
        commissionStatus: refunded ? "refunded" : "unpaid",

        // item line (your DB currently stores CHARGE id in paymentIntentId)
        items: [{
          orderDate: new Date(ch.created * 1000),
          orderNumber: orderId,
          paymentIntentId: ch.id,          // <-- CHARGE id (kept to match your current docs)
          product: ch.description || "Woo order",
          refId: refId,
          status: refunded ? "refunded" : "processing",
          unitPrice: amount,
          lineTotal: amount,
          subtotal: amount,
          tax: 0,
          shipping: 0,
          title: "purchase",
          total: amount,
          timestamp: new Date(ch.created * 1000),
        }],

        // optional convenience (safe to keep; won’t break schema)
        customerEmail:
          ch.billing_details?.email ||
          (typeof pi?.receipt_email === "string" ? pi.receipt_email : null) ||
          ch.metadata?.customer_email ||
          null,
      };

      // ADD-ONLY guard: skip insert if we already have this CHARGE or this (source, orderId)
      const ors: any[] = [{ "items.paymentIntentId": ch.id }];
      if (orderId) ors.push({ source: "woocommerce", orderId });

      const exists = await Sales.findOne({ $or: ors }, { projection: { _id: 1 } });
      if (exists) { skippedExisting++; continue; }

      // Insert new only (no updates => preserves paid/processing/etc.)
      await Sales.insertOne(saleDoc);
      inserted++;
    }

    after = page.data[page.data.length - 1].id;
    if (!page.has_more) break;
  }

  console.log({ inserted, skippedExisting, skippedFilter });
  await mongo.close();
}

main().catch(err => { console.error(err); process.exit(1); });
