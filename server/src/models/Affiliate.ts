import mongoose, { CallbackError, Document, Schema, Types } from "mongoose";
import * as bcrypt from 'bcrypt';

interface IAffiliate extends Document {
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
  password: string;
  // selectedProducts: Types.ObjectId[]; // Or if populated: Product[] // array of productIds the affiliate promotes
}

const AffiliateSchema = new Schema<IAffiliate>({
  name: { type: String, required: false, trim: true },
  email: { type: String, required: true, unique: true, trim: true },
  refId: { type: String, required: true },
  password: { type: String, required: true, minlength: 6 }, // ✅ don't make it unique
  totalClicks: { type: Number, default: 0 },
  totalCommissions: { type: Number, default: 0 },
  //  selectedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }], // The products affiliate choosed to promote on his/her website
});

AffiliateSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as CallbackError); // Pass the error to the next middleware or catch block
  }
});

const Affiliate = mongoose.model<IAffiliate>("Affiliate", AffiliateSchema);

export default Affiliate;
