import mongoose, { CallbackError, Document, Schema } from "mongoose";
import * as bcrypt from "bcrypt";

interface IPaymentRecord {
  amount: number;
  date: Date;
  method: "paypal" | "bank" | "crypto" | string;
  transactionId?: string;
  notes?: string;
}

interface INotification {
  date: Date;
  title: string;
  text: string;
  read: boolean;
}

interface IAffiliate extends Document {
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
  createdAt?: Date; // ✅ Automatically added by Mongoose
  updatedAt?: Date; // ✅ Automatically added by Mongoose
  paymentHistory?: IPaymentRecord[];
  notifications?: INotification[];
}

const AffiliateSchema = new Schema<IAffiliate>(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    refId: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 }, // ✅ don't make it unique
    totalClicks: { type: Number, default: 0 },
    totalCommissions: { type: Number, default: 0 },
    stripeAccountId: { type: String },
    commissionRate: { type: Number, default: 0.1 }, // 10 %
    totalSales: { type: Number, default: 0 },
    role: { type: String, enum: ["admin", "affiliate"], default: "affiliate" },
    paymentHistory: [
      {
        amount: { type: Number },
        date: { type: Date },
        method: { type: String },
        transactionId: { type: String },
        notes: { type: String },
      },
    ],
    notifications: {
      type: [
        {
          date: { type: Date },
          title: { type: String },
          text: { type: String },
          read: { type: Boolean, default: false }, // ✅ This is where default is defined
        },
      ],
      default: [], // ✅ Ensures the notifications array is always initialized
    },
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
