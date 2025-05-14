import mongoose, { Schema } from "mongoose";
const ProductSchema = new Schema({
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    price: { type: Number, required: false },
    quantity: { type: Number, required: false },
    category: { type: String, required: true },
    description: { type: String, required: false },
    imageUrl: { type: String, required: false },
    url: { type: String, required: false },
});
const Product = mongoose.model("Product", ProductSchema);
export default Product;
