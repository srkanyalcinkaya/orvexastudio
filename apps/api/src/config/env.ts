import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().min(1, "MONGODB_URI gerekli"),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  ADMIN_EMAIL: z.string().email().default("admin@orvexa.co.uk"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_PUBLIC_KEY: z.string().min(1),
  ROYAL_MAIL_API_BASE_URL: z.string().default("https://api.royalmail.net"),
  ROYAL_MAIL_API_KEY: z.string().default(""),
  ROYAL_MAIL_API_SECRET: z.string().default(""),
  SHIPPING_FROM_POSTCODE: z.string().default("SW1A1AA"),
  MEDIA_PROVIDER: z.enum(["cloudinary", "s3"]).default("cloudinary"),
  CLOUDINARY_CLOUD_NAME: z.string().default(""),
  CLOUDINARY_API_KEY: z.string().default(""),
  CLOUDINARY_API_SECRET: z.string().default(""),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default("orvexa"),
  S3_REGION: z.string().default("eu-west-2"),
  S3_BUCKET: z.string().default(""),
  S3_ACCESS_KEY_ID: z.string().default(""),
  S3_SECRET_ACCESS_KEY: z.string().default(""),
});

export const env = envSchema.parse(process.env);
