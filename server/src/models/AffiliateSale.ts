import mongoose, { Document, Schema, Types } from "mongoose";

interface IAffiliateSale extends Document {
  // affiliateId: Types.ObjectId;
  productId: Types.ObjectId;
  refId: string;
  buyerEmail: string;
  amount: number;
  event: "purchase";
  timestamp: Date;
}

const AffiliateSaleSchema = new Schema<IAffiliateSale>({
  // affiliateId: {
  //   type: Schema.Types.ObjectId,
  //   ref: "Affiliate",
  //   required: true,
  // },
  refId: { type: String, required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product" },
  event: { type: String, required: true },
  amount: { type: Number },
  timestamp: { type: Date, default: Date.now },
  buyerEmail: { type: String, required: false },
});

const AffiliateSale = mongoose.model<IAffiliateSale>(
  "AffiliateSale",
  AffiliateSaleSchema
);
export default AffiliateSale;
