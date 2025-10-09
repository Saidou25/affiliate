// src/models/Affiliate.ts
import mongoose, { CallbackError, Document, Schema, Types } from "mongoose";
import * as bcrypt from "bcrypt";

interface INotification {
  _id?: Types.ObjectId;
  date: Date;
  title: string;
  text: string;
  read: boolean;
}

// Snapshot of a Payment stored on Affiliate.paymentHistory
// Mirrors fields you'll need in reconcile/webhook updates
export interface IPaymentSnapshot {
  paymentId?: Types.ObjectId; // ref -> Payment
  refId?: string; // affiliate refId (denormalized)
  affiliateId?: Types.ObjectId; // ref -> Affiliate (denormalized)
  saleIds?: Types.ObjectId[]; // refs -> AffiliateSale[]
  saleAmount?: number;
  paidCommission?: number;
  productName?: string;
  date?: Date; // when record was created (or paidAt)
  method?: string; // "stripe_transfer" | "bank" | ...
  transactionId?: string; // tr_..., MANUAL-...
  notes?: string;
  currency?: string; // e.g., "usd"
  status?:
    | "processing"
    | "paid"
    | "failed"
    | "transfer_created"
    | "transfer_reversed";
  paidAt?: Date | null; // Stripe-confirmed settlement time
}

export interface IAffiliate extends Document {
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
  totalSales: number;
  password: string;
  stripeAccountId?: string;
  commissionRate: number;
  role?: "admin" | "affiliate";
  createdAt?: Date;
  updatedAt?: Date;
  paymentHistory?: IPaymentSnapshot[];
  notifications?: INotification[];
  avatar?: string;
}

const PaymentSnapshotSchema = new Schema<IPaymentSnapshot>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment" },
    refId: { type: String },
    affiliateId: { type: Schema.Types.ObjectId, ref: "Affiliate" },
    saleIds: [{ type: Schema.Types.ObjectId, ref: "AffiliateSale" }],
    saleAmount: { type: Number },
    paidCommission: { type: Number },
    productName: { type: String },
    date: { type: Date },
    method: { type: String },
    transactionId: { type: String }, // used by arrayFilters to update in-place
    notes: { type: String },
    currency: { type: String },
    status: {
      type: String,
      enum: [
        "processing",
        "paid",
        "failed",
        "transfer_created",
        "transfer_reversed",
      ],
      default: "processing",
    },
    paidAt: { type: Date, default: null },
  },
  { _id: false } // snapshots don't need their own _id unless you want it
);

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      set: (s: any) =>
        typeof s === "string" ? s.trim().replace(/^"+|"+$/g, "") : s,
    },
    text: {
      type: String,
      default: "",
      set: (s: any) =>
        typeof s === "string" ? s.trim().replace(/^"+|"+$/g, "") : s,
    },
    read: { type: Boolean, default: false },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      // Be forgiving: trim strings, parse, and fallback instead of throwing
      set: (v: any) => {
        if (!v) return new Date();
        const d = new Date(String(v).trim());
        return Number.isNaN(d.getTime()) ? new Date() : d;
      },
    },
  },
  { _id: true }
);

const AffiliateSchema = new Schema<IAffiliate>(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    refId: { type: String, required: true, unique: true }, // set unique: true if you require uniqueness
    password: { type: String, required: true, minlength: 6 },
    totalClicks: { type: Number, default: 0 },
    totalCommissions: { type: Number, default: 0 },
    stripeAccountId: { type: String },
    commissionRate: { type: Number, default: 0.1 },
    totalSales: { type: Number, default: 0 },
    role: { type: String, enum: ["admin", "affiliate"], default: "affiliate" },
    avatar: { type: String },

    // ⬇️ New, structured snapshot subdocuments
    paymentHistory: { type: [PaymentSnapshotSchema], default: [] },

    // unchanged notifications, but using a sub-schema
    notifications: { type: [NotificationSchema], default: [] },
  },
  { timestamps: true }
);

// Hash password if modified
AffiliateSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as CallbackError);
  }
});

const Affiliate = mongoose.model<IAffiliate>("Affiliate", AffiliateSchema);
export default Affiliate;
