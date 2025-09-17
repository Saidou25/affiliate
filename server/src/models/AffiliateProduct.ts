import mongoose, { Schema } from "mongoose";

const AffiliateProductSchema = new Schema({
  wooId: { type: Number, unique: true, index: true, required: true },
  slug: { type: String, required: true },
  name: { type: String, required: true },
  permalink: { type: String, required: true },
  price: { type: Number, default: null },
  currency: { type: String, default: null },
  onSale: { type: Boolean, default: false },
  regularPrice: { type: Number, default: null },
  salePrice: { type: Number, default: null },
  stockStatus: { type: String, required: true }, // in_stock | out_of_stock
  primaryImage: { type: String, default: null },
  categorySlugs: { type: [String], default: [] },
  updatedAt: { type: Date, required: true }, // from Woo "date_modified"
  hasOptions: { type: Boolean, required: true },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: () => new Date() },
  modifiedAt: { type: Date, default: () => new Date() },
  description: { type: String, default: null },
  shortDescription: { type: String, default: null },
  plainDescription: { type: String, default: null },
});

AffiliateProductSchema.index({ active: 1 });
AffiliateProductSchema.index({ slug: 1 });
AffiliateProductSchema.index({ name: "text" });

AffiliateProductSchema.pre("save", function (next) {
  (this as any).modifiedAt = new Date();
  next();
});

export default mongoose.model("AffiliateProduct", AffiliateProductSchema);
