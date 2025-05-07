import mongoose, { Document, Schema } from "mongoose";

interface IAffiliate extends Document {
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
}

const AffiliateSchema = new Schema<IAffiliate>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  refId: { type: String, required: true },
  totalClicks: { type: Number, required: false },
  totalCommissions: { type: Number, required: false },
});

const Affiliate = mongoose.model<IAffiliate>("Affiliate", AffiliateSchema);

export default Affiliate;
