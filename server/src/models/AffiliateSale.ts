import mongoose, { Document, Schema } from "mongoose";

/**
 * Line Item sub-schema
 */
const ItemSchema = new Schema(
  {
    wooProductId: { type: Number },
    name: { type: String },
    qty: { type: Number },
    unitPrice: { type: Number },
    lineTotal: { type: Number },
  },
  { _id: false }
);

/**
 * Refund entry sub-schema
 */
const RefundEntrySchema = new Schema(
  {
    id: { type: String, required: true }, // rf_... (or synthetic id)
    amount: { type: Number, required: true }, // refund amount (positive)
    status: { type: String }, // pending | succeeded | failed | ...
    createdAt: { type: Date },
    updatedAt: { type: Date },
  },
  { _id: false }
);

export interface IAffiliateSale extends Document {
  // ── Legacy / existing fields ────────────────────────────────────────────────
  productId?: string;
  refId?: string;
  buyerEmail?: string;
  amount?: number;
  title?: "purchase" | string;
  event?: "purchase" | string;
  timestamp?: Date;
  commissionEarned?: number;
  commissionStatus?: "paid" | "unpaid" | "processing" | "reversed" | "refunded";
  paidAt?: Date;
  processingAt?: Date;
  paymentId?: mongoose.Types.ObjectId;

  // ── Stripe / payouts linkage ───────────────────────────────────────────────
  stripeAccountId?: string; // acct_...
  transferId?: string; // tr_...
  payoutId?: string; // po_...
  // more link fields to help matching in webhooks/importers:
  stripeChargeId?: string; // ch_...
  stripePaymentIntentId?: string; // pi_...

  // ── Newer fields for Woo/Stripe ingest ─────────────────────────────────────
  source?: "woocommerce" | "stripe" | "manual";
  orderId?: string;
  orderNumber?: string;
  orderDate?: Date;

  status?: string; // Woo-style fulfillment status
  currency?: string;

  subtotal?: number;
  discount?: number;
  tax?: number;
  shipping?: number;
  total?: number;

  paymentIntentId?: string; // historically used by you (may be ch_ or pi_)
  items?: any[];
  product?: any;

  // ── Commission config snapshot ─────────────────────────────────────────────
  commissionRate?: number; // e.g., 0.10 (10%)

  // ── Refund tracking (top-level + history) ──────────────────────────────────
  refundStatus?: "none" | "partial" | "full";
  refunds?: Array<{
    id: string;
    amount: number;
    status?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
  refundTotal?: number; // cumulative refunded amount
  refundedAt?: Date; // time of most recent succeeded refund
  // kept for mutation compatibility (last refund snapshot):
  refundId?: string;
  refundAmount?: number;
  refundAt?: Date;

  // ── Payout status (for UX clarity and retries) ─────────────────────────────
  payoutStatus?: "pending" | "paid" | "failed" | "canceled";
  lastPayoutId?: string;
  lastPayoutAt?: Date;
  payoutFailureCode?: string;
  payoutFailureMessage?: string;

  createdAt?: Date;
  updatedAt?: Date;

  // ── Instance helpers ───────────────────────────────────────────────────────
  computeCommissionBase(): number;
  computeCommissionEarned(): number;
}

/**
 * MAIN SCHEMA
 */
const AffiliateSaleSchema = new Schema<IAffiliateSale>(
  {
    // Legacy / existing
    refId: { type: String, index: true },
    productId: { type: String },
    event: { type: String, default: "purchase" },
    title: { type: String, default: "purchase" },
    amount: { type: Number, min: 0 },
    timestamp: { type: Date, default: Date.now },
    buyerEmail: { type: String },

    commissionEarned: { type: Number, default: 0, min: 0 },
    commissionStatus: {
      type: String,
      enum: ["paid", "unpaid", "processing", "reversed", "refunded"],
      default: "unpaid",
      index: true,
    },

    paidAt: { type: Date },
    processingAt: { type: Date },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },

    // Stripe linkage
    stripeAccountId: { type: String, index: true }, // acct_...
    transferId: { type: String }, // tr_...
    payoutId: { type: String }, // po_...
    stripeChargeId: { type: String, index: true }, // ch_...
    stripePaymentIntentId: { type: String, index: true }, // pi_...

    // Woo/Stripe ingest
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

    subtotal: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },

    paymentIntentId: { type: String, index: true },

    items: { type: [ItemSchema], default: [] },
    product: { type: Schema.Types.Mixed, default: null },

    // Commission config snapshot
    commissionRate: { type: Number, min: 0, max: 1 },

    // Refunds
    refundStatus: {
      type: String,
      enum: ["none", "partial", "full"],
      default: "none",
      index: true,
    },
    refunds: { type: [RefundEntrySchema], default: [] },
    refundTotal: { type: Number, default: 0, min: 0 },
    refundedAt: { type: Date },

    // last refund snapshot (kept for compatibility with your mutation)
    refundId: { type: String },
    refundAmount: { type: Number, min: 0 },
    refundAt: { type: Date },

    // Payout status (UX/status clarity for admin)
    payoutStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "canceled"],
      index: true,
    },
    lastPayoutId: { type: String },
    lastPayoutAt: { type: Date },
    payoutFailureCode: { type: String },
    payoutFailureMessage: { type: String },
  },
  {
    timestamps: true,
    strict: true,
  }
);

/**
 * INDICES
 */
AffiliateSaleSchema.index(
  { source: 1, orderId: 1 },
  { unique: true, sparse: true }
);
AffiliateSaleSchema.index({ refId: 1, orderDate: -1 });
AffiliateSaleSchema.index({ createdAt: -1 });
AffiliateSaleSchema.index({ stripeAccountId: 1, commissionStatus: 1 });
AffiliateSaleSchema.index({ transferId: 1 }, { sparse: true });
AffiliateSaleSchema.index({ payoutId: 1 }, { sparse: true });
AffiliateSaleSchema.index({ refId: 1, commissionStatus: 1 });

/**
 * Helpers
 */
AffiliateSaleSchema.methods.computeCommissionBase = function (): number {
  const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);

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

  const subtotal = toNum(this.subtotal);
  const discount = toNum(this.discount);
  if (subtotal || discount) return Math.max(0, subtotal - discount);

  const total = toNum(this.total);
  const tax = toNum(this.tax);
  const shipping = toNum(this.shipping);
  return Math.max(0, total - tax - shipping);
};

AffiliateSaleSchema.methods.computeCommissionEarned = function (): number {
  const rate = Number(this.commissionRate ?? 0);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  const base = this.computeCommissionBase();
  return Math.round(base * rate * 100) / 100;
};

/**
 * Snapshot commissionEarned if missing and rate exists.
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
