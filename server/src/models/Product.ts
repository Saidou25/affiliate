import mongoose, { Document, Schema } from "mongoose";

interface Product extends Document {
  title: string;
  subtitle: string;
  description: string;
  price: number;
  quantity: number;
  category: string;
  imageUrl: string;
  url: string;
}

const ProductSchema = new Schema<Product>({
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  price: { type: Number, required: false },
  quantity: { type: Number, required: false },
  category: { type: String, required: true },
  description: { type: String, required: false },
  imageUrl: { type: String, required: false },
  url: { type: String, required: false },
});

const Product = mongoose.model<Product>("Product", ProductSchema);

export default Product;
