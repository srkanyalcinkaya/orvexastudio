import { Schema, model, type InferSchemaType } from "mongoose";

const addressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    county: { type: String },
    postcode: { type: String, required: true },
    country: { type: String, required: true, default: "GB" },
    phone: { type: String },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String },
    phone: { type: String },
    roles: { type: [String], default: ["customer"] },
    addresses: { type: [addressSchema], default: [] },
    refreshTokenHash: { type: String, default: null },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema>;
export const UserModel = model<UserDocument>("User", userSchema);
