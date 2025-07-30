import mongoose, { Document, Schema } from "mongoose";

interface IAffiliateSale extends Document {
  productId: string;
  refId: string;
  buyerEmail: string;
  amount: number;
  title: "purchase";
  event: "purchase";
  timestamp: Date;
  commissionEarned: number;
  commissionStatus: "paid" | "unpaid";
  paidAt: Date;
  paymentId?: mongoose.Types.ObjectId;
}

const AffiliateSaleSchema = new Schema<IAffiliateSale>({
  refId: { type: String, required: true },
  productId: { type: String },
  event: { type: String },
  title: { type: String },
  amount: { type: Number },
  timestamp: { type: Date, default: Date.now },
  buyerEmail: { type: String },
  commissionEarned: { type: Number },
  commissionStatus: {
    type: String,
    enum: ["paid", "unpaid"],
    default: "unpaid", // ✅ Mongoose handles the default
  },
  paidAt: { type: Date },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
});

const AffiliateSale = mongoose.model<IAffiliateSale>(
  "AffiliateSale",
  AffiliateSaleSchema
);
export default AffiliateSale;
