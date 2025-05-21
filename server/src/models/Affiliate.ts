import mongoose, { CallbackError, Document, Schema } from "mongoose";
import * as bcrypt from "bcrypt";

interface IAffiliate extends Document {
  name: string;
  email: string;
  refId: string;
  totalClicks: number;
  totalCommissions: number;
  password: string;
  commissionRate: number;
  totalSales: number;
  createdAt?: Date; // ✅ Automatically added by Mongoose
  updatedAt?: Date; // ✅ Automatically added by Mongoose
}

const AffiliateSchema = new Schema<IAffiliate>(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    refId: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 }, // ✅ don't make it unique
    totalClicks: { type: Number, default: 0 },
    totalCommissions: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 0.1 }, // 10 %
    totalSales: { type: Number, default: 0 },
  },
  { timestamps: true } // 👈 automatically adds createdAt and updatedAt
);

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
