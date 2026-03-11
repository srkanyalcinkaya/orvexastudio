import { Schema, model, type InferSchemaType } from "mongoose";

const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    productIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

export type WishlistDocument = InferSchemaType<typeof wishlistSchema>;
export const WishlistModel = model<WishlistDocument>("Wishlist", wishlistSchema);
