import mongoose, { Schema } from "mongoose";

interface IClickLog extends Document {
  refId: string;
  ipAddress: string;
  pageUrl: string;
  createdAt?: Date; // Automatically added by Mongoose
  updatedAt?: Date; // Automatically added by Mongoose
  userAgent: string;
}
const ClickLogSchema = new Schema<IClickLog>(
  {
    refId: {
      type: String,
      // required: true,
    },
    // ipAddress: String, // optional
    // userAgent: String, // optional
    // pageUrl: String, // optional
  },
  { timestamps: true } // 👈 automatically adds createdAt and updatedAt
);

const ClickLog = mongoose.model("ClickLog", ClickLogSchema);

export default ClickLog;
