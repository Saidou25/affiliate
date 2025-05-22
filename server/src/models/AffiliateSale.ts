import mongoose, { Document, Schema } from "mongoose";

interface IAffiliateSale extends Document {
  productId: string,
  refId: string,
  buyerEmail: string,
  amount: number,
  event: "purchase",
  timestamp: Date,
  commissionEarned: number
}

const AffiliateSaleSchema = new Schema<IAffiliateSale>({
  refId: { type: String, required: true },
  productId: { type: String },
  event: { type: String, required: true },
  amount: { type: Number },
  timestamp: { type: Date, default: Date.now },
  buyerEmail: { type: String, required: false },
  commissionEarned: { type: Number }
});

const AffiliateSale = mongoose.model<IAffiliateSale>(
  "AffiliateSale",
  AffiliateSaleSchema
);
export default AffiliateSale;
