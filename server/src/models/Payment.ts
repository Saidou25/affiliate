import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  affiliateId: mongoose.Types.ObjectId;
  refId: string;
  saleIds: mongoose.Types.ObjectId[];
  saleAmount: number;
  paidCommission: number;
  productName: string;
  date: string;
  method: "paypal" | "bank" | "crypto" | string;
  transactionId?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  currency: string;
  // Stripe sync
  status: string;
  transferId: string;
  balanceTransactionId: string;
  payoutId: string;
  payoutStatus: string;
  payoutArrivalDate: Date;
  reversalId?: string;
}

const PaymentSchema = new Schema<IPayment>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
    }, //  who was paid
    refId: { type: String },
    saleIds: [{ type: Schema.Types.ObjectId, ref: "AffiliateSale" }], // which sales were included in this payment
    saleAmount: { type: Number, required: true }, // total amount paid
    paidCommission: { type: Number }, // total amount paid
    productName: { type: String },
    date: { type: String }, // payment date
    method: { type: String, required: true }, //  "bank", "paypal", etc.
    transactionId: { type: String }, // for bank/PayPal tracking (optional)
    notes: { type: String }, // free text field for admin notes
    currency: { type: String, default: "usd" },
    status: { type: String, default: "initiated", index: true },
    transferId: { type: String, unique: true, sparse: true }, // Stripe tr_...
    balanceTransactionId: { type: String },
    payoutId: { type: String, index: true }, // Stripe po_...
    payoutStatus: { type: String }, // paid, pending, failed...
    payoutArrivalDate: { type: Date },
    reversalId: { type: String },
  },
  { timestamps: true }
);

PaymentSchema.virtual("id").get(function (this: any) {
  return this._id.toHexString();
});

PaymentSchema.set("toJSON", { virtuals: true });
PaymentSchema.set("toObject", { virtuals: true });

const Payment = mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
