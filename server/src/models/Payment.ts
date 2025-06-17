import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  affiliateId: mongoose.Types.ObjectId;
  saleIds: mongoose.Types.ObjectId[];
  saleAmount: number;
  paidCommission: number;
  productName: string;
  date: Date;
  method: "paypal" | "bank" | "crypto" | string;
  transactionId?: string;
  notes?: string;
}

const PaymentSchema = new Schema<IPayment>(
  {
    affiliateId: {
      type: Schema.Types.ObjectId,
      ref: "Affiliate",
      required: true,
    }, //  who was paid
    saleIds: [{ type: Schema.Types.ObjectId, ref: "AffiliateSale" }], // which sales were included in this payment
    saleAmount: { type: Number, required: true }, // total amount paid
    paidCommission: { type: Number }, // total amount paid
    productName: { type: String },
    date: { type: Date, default: Date.now }, // payment date
    method: { type: String, required: true }, //  "bank", "paypal", etc.
    transactionId: { type: String }, // for bank/PayPal tracking (optional)
    notes: { type: String }, // free text field for admin notes
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
