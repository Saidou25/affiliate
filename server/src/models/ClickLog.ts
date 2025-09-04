import mongoose, { Schema } from "mongoose";

interface IClickLog extends Document {
  refId: string;
  ipAddress?: string;
  pageUrl?: string;
  createdAt?: Date; // Automatically added by Mongoose
  updatedAt?: Date; // Automatically added by Mongoose
  userAgent?: string;
}
const ClickLogSchema = new Schema<IClickLog>(
  {
    refId: {
      type: String,
    },
    ipAddress: { type: String },
    userAgent: { type: String },
    pageUrl: { type: String },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

const ClickLog = mongoose.model("ClickLog", ClickLogSchema);

export default ClickLog;
