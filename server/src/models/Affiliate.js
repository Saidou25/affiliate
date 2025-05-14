import mongoose, { Schema } from "mongoose";
// import bcrypt from "bcrypt"; // Or use bcrypt if you prefer
import * as bcrypt from 'bcrypt';
const AffiliateSchema = new Schema({
    name: { type: String, required: false, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    refId: { type: String, required: true },
    password: { type: String, required: true, minlength: 6 }, // ✅ don't make it unique
    totalClicks: { type: Number, default: 0 },
    totalCommissions: { type: Number, default: 0 },
});
AffiliateSchema.pre("save", async function (next) {
    if (!this.isModified("password"))
        return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error); // Pass the error to the next middleware or catch block
    }
});
const Affiliate = mongoose.model("Affiliate", AffiliateSchema);
export default Affiliate;
