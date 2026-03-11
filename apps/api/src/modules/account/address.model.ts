import { Schema, model, type InferSchemaType } from "mongoose";

const addressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    addressType: { type: String, enum: ["shipping", "billing", "both"], default: "shipping" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    county: { type: String },
    postcode: { type: String, required: true },
    country: { type: String, required: true, default: "GB" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type AddressDocument = InferSchemaType<typeof addressSchema>;
export const AddressModel = model<AddressDocument>("Address", addressSchema);
