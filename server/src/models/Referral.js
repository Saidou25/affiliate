import mongoose, { Schema } from "mongoose";
const ReferralSchema = new Schema({
    email: { type: String, required: true },
    refId: { type: String, required: true },
    event: { type: String, required: true },
    //   timestamp: { type: Date, default: Date.now },
});
const Refferal = mongoose.model("Refferal", ReferralSchema);
export default Refferal;
