// server/src/models/AffiliateSale.ts
import mongoose, { Document, Schema } from "mongoose";

/**
 * Item shape (kept optional/loose to avoid breaking existing payloads).
 * NOTE: We use a sub-schema for better typing/validation without changing the
 *       public field name `items` or its basic structure (array of objects).
 */
const ItemSchema = new Schema(
  {
    wooProductId: { type: Number }, // Woo product id if available
    name: { type: String },
    qty: { type: Number }, // quantity purchased
    unitPrice: { type: Number }, // price per unit
    lineTotal: { type: Number }, // qty * unitPrice after discounts
  },
  { _id: false }
);

export interface IAffiliateSale extends Document {
  // ───── Legacy fields you already had (names preserved) ──────────────────────
  productId?: string;
  refId?: string; // affiliate refId (e.g., bboWS8LP)
  buyerEmail?: string;
  amount?: number; // legacy total (kept for compatibility)
  title?: "purchase" | string;
  event?: "purchase" | string;
  timestamp?: Date; // legacy event time
  commissionEarned?: number; // computed sale commission (snapshot)
  commissionStatus?: "paid" | "unpaid" | "processing" | "reversed" | "refunded";
  paidAt?: Date;
  processingAt?: Date; // NEW
  paymentId?: mongoose.Types.ObjectId;

  // ───── Stripe / payouts linkage (NEW) ───────────────────────────────────────
  stripeAccountId?: string; // acct_... (destination connected account)
  transferId?: string; // tr_... (platform → connected account)
  payoutId?: string; // po_... (connected account → bank)

  // ───── Newer fields for Woo/Stripe ingest (names preserved) ────────────────
  source?: "woocommerce" | "stripe" | "manual";
  orderId?: string; // external system id (unique per source)
  orderNumber?: string; // human-facing number
  orderDate?: Date;

  status?: string; // e.g., processing, completed, refunded
  currency?: string; // e.g., USD

  subtotal?: number; // sum of line items before tax/shipping
  discount?: number; // order-level discount (if any)
  tax?: number; // order tax
  shipping?: number; // shipping cost
  total?: number; // grand total (Woo total)

  paymentIntentId?: string; // Stripe PI if available
  items?: any[]; // line items array from Woo
  product?: any; // optional single-product shape

  // ───── Added: snapshot of the rate used for THIS sale ──────────────────────
  /**
   * commissionRate
   * Snapshot of the commission rate applied to this sale (e.g., 0.10 for 10%).
   * Storing it here ensures future rate changes do not alter historical sales.
   */
  commissionRate?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * MAIN SCHEMA
 * - Existing names preserved.
 * - Adds Stripe linkage fields needed by your webhook flow.
 */
const AffiliateSaleSchema = new Schema<IAffiliateSale>(
  {
    // ─── Legacy fields (kept) ────────────────────────────────────────────────
    refId: { type: String, index: true },
    productId: { type: String },
    event: { type: String, default: "purchase" },
    title: { type: String, default: "purchase" },
    amount: { type: Number, min: 0 }, // legacy number; left optional
    timestamp: { type: Date, default: Date.now },
    buyerEmail: { type: String },

    // Computed per-sale commission (snapshot)
    commissionEarned: { type: Number, default: 0, min: 0 },

    // Expanded enum to reflect UI logic (now also includes 'refunded')
    commissionStatus: {
      type: String,
      enum: ["paid", "unpaid", "processing", "reversed", "refunded"],
      default: "unpaid",
      index: true,
    },

    paidAt: { type: Date },
    processingAt: { type: Date }, // NEW
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },

    // ─── Stripe linkage (NEW) ────────────────────────────────────────────────
    stripeAccountId: { type: String, index: true }, // acct_...
    transferId: { type: String, index: true }, // tr_...
    payoutId: { type: String, index: true }, // po_...

    // ─── Newer fields for Woo/Stripe ─────────────────────────────────────────
    source: {
      type: String,
      enum: ["woocommerce", "stripe", "manual"],
      index: true,
    },
    orderId: { type: String, index: true }, // together with source unique
    orderNumber: { type: String },
    orderDate: { type: Date },

    status: { type: String, default: "processing", index: true },
    currency: { type: String, default: "USD" },

    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },

    paymentIntentId: { type: String, index: true },

    // Keep the public name `items` the same. Using a sub-schema adds light validation.
    items: { type: [ItemSchema], default: [] },

    // Keep `product` flexible (Mixed) to avoid breaking older data
    product: { type: Schema.Types.Mixed, default: null },

    // ─── Commission config snapshot ───────────────────────────────────────────
    commissionRate: {
      type: Number, // e.g., 0.10 for 10%
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt
    strict: true,
  }
);

/**
 * INDICES
 * - Idempotency: one sale per (source, orderId)
 * - Webhook matchers for payout flipping and transfer lookups
 */
AffiliateSaleSchema.index(
  { source: 1, orderId: 1 },
  { unique: true, sparse: true }
);
AffiliateSaleSchema.index({ refId: 1, orderDate: -1 });
AffiliateSaleSchema.index({ createdAt: -1 });

// Helpful for payout flip (Connect webhook): find in-flight rows fast
AffiliateSaleSchema.index({ stripeAccountId: 1, commissionStatus: 1 });

// Optional but handy when correlating programmatically
AffiliateSaleSchema.index({ transferId: 1 }, { sparse: true });
AffiliateSaleSchema.index({ payoutId: 1 }, { sparse: true });
AffiliateSaleSchema.index({ refId: 1, commissionStatus: 1 });

/**
 * Helper: compute the commission base for this sale.
 * Convention (recommended): subtotal - discount (i.e., exclude shipping/tax).
 * Falls back to line items sum, then to total - tax - shipping.
 */
AffiliateSaleSchema.methods.computeCommissionBase = function (): number {
  const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

  // Prefer line items if available (more precise after per-line discounts)
  if (Array.isArray(this.items) && this.items.length > 0) {
    const lines = this.items.reduce((acc: number, it: any) => {
      const lt = toNum(it?.lineTotal);
      if (lt) return acc + lt;
      const up = toNum(it?.unitPrice);
      const qty = toNum(it?.qty);
      return acc + up * qty;
    }, 0);
    const discount = toNum(this.discount);
    return Math.max(0, lines - discount);
  }

  // Next best: subtotal - discount, if present
  const subtotal = toNum(this.subtotal);
  const discount = toNum(this.discount);
  if (subtotal || discount) return Math.max(0, subtotal - discount);

  // Final fallback: total - tax - shipping
  const total = toNum(this.total);
  const tax = toNum(this.tax);
  const shipping = toNum(this.shipping);
  return Math.max(0, total - tax - shipping);
};

/**
 * Helper: compute commission amount from current snapshot rate.
 * Only runs if a `commissionRate` is present.
 * Return value is NOT automatically persisted; see pre-save hook below.
 */
AffiliateSaleSchema.methods.computeCommissionEarned = function (): number {
  const rate = Number(this.commissionRate ?? 0);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  const base = this.computeCommissionBase();
  return Math.round(base * rate * 100) / 100;
};

/**
 * pre('save')
 * - If `commissionEarned` is missing/zero AND a `commissionRate` is set,
 *   compute and snapshot `commissionEarned`.
 */
AffiliateSaleSchema.pre("save", function (next) {
  if (!this.isModified("commissionEarned") && !this.isNew) return next();

  const current = Number(this.commissionEarned ?? 0);
  const rate = Number(this.commissionRate ?? 0);

  if (
    (Number.isNaN(current) || current <= 0) &&
    Number.isFinite(rate) &&
    rate > 0
  ) {
    const computed = (this as any).computeCommissionEarned();
    this.commissionEarned = computed;
  }

  next();
});

const AffiliateSale =
  mongoose.models.AffiliateSale ||
  mongoose.model<IAffiliateSale>("AffiliateSale", AffiliateSaleSchema);

export default AffiliateSale;
