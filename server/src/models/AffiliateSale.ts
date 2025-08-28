// server/src/models/AffiliateSale.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IAffiliateSale extends Document {
  // Legacy fields you already had
  productId?: string;
  refId?: string;                // affiliate refId (e.g., bboWS8LP)
  buyerEmail?: string;
  amount?: number;               // legacy total (kept for compatibility)
  title?: "purchase" | string;
  event?: "purchase" | string;
  timestamp?: Date;              // legacy event time
  commissionEarned?: number;
  commissionStatus?: "paid" | "unpaid";
  paidAt?: Date;
  paymentId?: mongoose.Types.ObjectId;

  // 🔹 New fields for Woo/Stripe ingest
  source?: "woocommerce" | "stripe" | "manual";
  orderId?: string;              // external system id (unique per source)
  orderNumber?: string;          // human-facing number
  orderDate?: Date;

  status?: string;               // e.g., processing, completed, refunded
  currency?: string;             // e.g., USD

  subtotal?: number;
  discount?: number;
  tax?: number;
  shipping?: number;
  total?: number;

  paymentIntentId?: string;      // Stripe PI if available
  items?: any[];                 // line items array from Woo
  product?: any;                 // optional single-product shape

  createdAt?: Date;
  updatedAt?: Date;
}

const AffiliateSaleSchema = new Schema<IAffiliateSale>(
  {
    // ——— Legacy fields (kept) ———
    refId: { type: String, index: true },
    productId: { type: String },
    event: { type: String, default: "purchase" },
    title: { type: String, default: "purchase" },
    amount: { type: Number },
    timestamp: { type: Date, default: Date.now },
    buyerEmail: { type: String },
    commissionEarned: { type: Number, default: 0 },
    commissionStatus: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
      index: true,
    },
    paidAt: { type: Date },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },

    // ——— New fields for Woo/Stripe ———
    source: {
      type: String,
      enum: ["woocommerce", "stripe", "manual"],
      index: true,
    },
    orderId: { type: String, index: true },
    orderNumber: { type: String },
    orderDate: { type: Date },

    status: { type: String, default: "processing", index: true },
    currency: { type: String, default: "USD" },

    subtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, default: 0 },

    paymentIntentId: { type: String, index: true },
    items: { type: Array, default: [] },
    product: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    strict: true,     // keep strict on now that fields exist
  }
);

// Idempotency: one sale per (source, orderId)
AffiliateSaleSchema.index({ source: 1, orderId: 1 }, { unique: true, sparse: true });

// Helpful query patterns
AffiliateSaleSchema.index({ refId: 1, orderDate: -1 });
AffiliateSaleSchema.index({ createdAt: -1 });

const AffiliateSale =
  mongoose.models.AffiliateSale ||
  mongoose.model<IAffiliateSale>("AffiliateSale", AffiliateSaleSchema);

export default AffiliateSale;
