import { Schema, model, type InferSchemaType } from "mongoose";

const variantSchema = new Schema(
  {
    sku: { type: String, required: true },
    title: { type: String, required: true },
    stemCount: { type: Number },
    color: { type: String },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const reviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    date: { type: String, required: true },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    heroImage: { type: String, required: true },
    gallery: { type: [String], default: [] },
    specs: { type: [String], default: [] },
    productStory: { type: String, default: "" },
    dimensions: { type: [String], default: [] },
    deliveryInfo: { type: [String], default: [] },
    makerStory: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    addedToCartCount: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    reviews: { type: [reviewSchema], default: [] },
    featured: { type: Boolean, default: false },
    variants: { type: [variantSchema], default: [] },
  },
  { timestamps: true },
);

export type ProductDocument = InferSchemaType<typeof productSchema>;
export const ProductModel = model<ProductDocument>("Product", productSchema);
