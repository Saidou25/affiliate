import mongoose, { Document, Schema } from "mongoose";

interface IReferral extends Document {
  email: string;
  refId: string;
  event: string;
//   timestamp: Date;
}

const ReferralSchema = new Schema<IReferral>({
  email: { type: String, required: true },
  refId: { type: String, required: true },
  event: { type: String, required: true },
//   timestamp: { type: Date, default: Date.now },
});

const Refferal = mongoose.model<IReferral>("Refferal", ReferralSchema);

export default Refferal;
