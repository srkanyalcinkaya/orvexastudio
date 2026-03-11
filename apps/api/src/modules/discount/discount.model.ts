import { Schema, model, type InferSchemaType } from "mongoose";

const discountSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    value: { type: Number, required: true },
    minOrderAmount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    startsAt: { type: Date },
    endsAt: { type: Date },
    usageLimit: { type: Number },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type DiscountDocument = InferSchemaType<typeof discountSchema>;
export const DiscountModel = model<DiscountDocument>("Discount", discountSchema);
