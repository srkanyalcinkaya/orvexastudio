import { Router } from "express";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import { z } from "zod";
import { env } from "../../config/env.js";
import { requireAdmin, requireAuth } from "../../middlewares/auth.middleware.js";
import { BlogModel } from "../blog/blog.model.js";
import { CategoryModel } from "../category/category.model.js";
import { DiscountModel } from "../discount/discount.model.js";
import { OrderModel } from "../order/order.model.js";
import { ProductModel } from "../product/product.model.js";

const router = Router();

const productSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  description: z.string().min(2),
  category: z.string().min(2),
  heroImage: z.string().url(),
  gallery: z.array(z.string().url()).default([]),
  specs: z.array(z.string()).default([]),
  productStory: z.string().default(""),
  dimensions: z.array(z.string()).default([]),
  deliveryInfo: z.array(z.string()).default([]),
  makerStory: z.string().default(""),
  stock: z.number().int().nonnegative().default(0),
  featured: z.boolean().default(false),
  variants: z.array(
    z.object({
      sku: z.string().min(2),
      title: z.string().min(2),
      stemCount: z.number().optional(),
      color: z.string().optional(),
      price: z.number().positive(),
      stock: z.number().nonnegative(),
    }),
  ),
});

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().default(""),
  isActive: z.boolean().default(true),
});

const blogSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  excerpt: z.string().min(8),
  content: z.string().min(20),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

const discountSchema = z.object({
  code: z.string().min(2),
  type: z.enum(["percentage", "fixed"]),
  value: z.number().positive(),
  minOrderAmount: z.number().nonnegative().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  usageLimit: z.number().int().positive().optional(),
});

const orderStatusSchema = z.object({
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  shippingStatus: z.enum(["pending", "label_created", "in_transit", "delivered"]).optional(),
});

const mediaSignSchema = z.object({
  fileName: z.string().min(3),
  contentType: z.string().default("image/jpeg"),
});

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  q: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

router.use(requireAuth, requireAdmin);

router.get("/media/provider", async (_req, res) => {
  return res.json({
    provider: env.MEDIA_PROVIDER,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder: env.CLOUDINARY_UPLOAD_FOLDER,
  });
});

router.post("/media/cloudinary-sign", async (req, res) => {
  if (env.MEDIA_PROVIDER !== "cloudinary") {
    return res.status(400).json({ message: "MEDIA_PROVIDER cloudinary değil." });
  }
  if (!env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_CLOUD_NAME) {
    return res.status(400).json({ message: "Cloudinary env eksik." });
  }

  const payload = mediaSignSchema.parse(req.body);
  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `${env.CLOUDINARY_UPLOAD_FOLDER}/${payload.fileName.replace(/\.[^.]+$/, "")}-${Date.now()}`;
  const signatureBase = `folder=${env.CLOUDINARY_UPLOAD_FOLDER}&public_id=${publicId}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
  const signature = crypto.createHash("sha1").update(signatureBase).digest("hex");

  return res.json({
    provider: "cloudinary",
    uploadUrl: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    fields: {
      api_key: env.CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder: env.CLOUDINARY_UPLOAD_FOLDER,
      public_id: publicId,
    },
  });
});

router.post("/media/s3-presign", async (req, res) => {
  if (env.MEDIA_PROVIDER !== "s3") {
    return res.status(400).json({ message: "MEDIA_PROVIDER s3 değil." });
  }
  if (!env.S3_BUCKET || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    return res.status(400).json({ message: "S3 env eksik." });
  }

  const payload = mediaSignSchema.parse(req.body);
  const fileKey = `uploads/${Date.now()}-${payload.fileName}`;
  const s3 = new S3Client({
    region: env.S3_REGION,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: fileKey,
    ContentType: payload.contentType,
  });
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
  const publicUrl = `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${fileKey}`;

  return res.json({
    provider: "s3",
    uploadUrl,
    fileKey,
    publicUrl,
  });
});

router.get("/overview", async (_req, res) => {
  const [products, categories, blogs, discounts, orders] = await Promise.all([
    ProductModel.countDocuments(),
    CategoryModel.countDocuments(),
    BlogModel.countDocuments(),
    DiscountModel.countDocuments(),
    OrderModel.countDocuments(),
  ]);

  return res.json({ products, categories, blogs, discounts, orders });
});

router.get("/products", async (_req, res) => {
  const query = listQuerySchema.parse(_req.query);
  const filter = query.q
    ? {
        $or: [
          { title: { $regex: query.q, $options: "i" } },
          { slug: { $regex: query.q, $options: "i" } },
          { category: { $regex: query.q, $options: "i" } },
        ],
      }
    : {};
  const total = await ProductModel.countDocuments(filter);
  const rows = await ProductModel.find(filter)
    .sort({ [query.sortBy]: query.sortDir === "asc" ? 1 : -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .lean();
  return res.json({
    rows,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  });
});

router.get("/products/:id", async (req, res) => {
  const product = await ProductModel.findById(req.params.id).lean();
  if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });
  return res.json(product);
});

router.post("/products", async (req, res) => {
  const payload = productSchema.parse(req.body);
  const product = await ProductModel.create(payload);
  return res.status(201).json(product);
});

router.patch("/products/:id", async (req, res) => {
  const payload = productSchema.partial().parse(req.body);
  const product = await ProductModel.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });
  return res.json(product);
});

router.delete("/products/:id", async (req, res) => {
  const deleted = await ProductModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Ürün bulunamadı." });
  return res.status(204).send();
});

router.get("/categories", async (_req, res) => {
  const query = listQuerySchema.parse(_req.query);
  const filter = query.q
    ? {
        $or: [
          { name: { $regex: query.q, $options: "i" } },
          { slug: { $regex: query.q, $options: "i" } },
        ],
      }
    : {};
  const total = await CategoryModel.countDocuments(filter);
  const rows = await CategoryModel.find(filter)
    .sort({ [query.sortBy]: query.sortDir === "asc" ? 1 : -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .lean();
  return res.json({
    rows,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  });
});

router.post("/categories", async (req, res) => {
  const payload = categorySchema.parse(req.body);
  const category = await CategoryModel.create(payload);
  return res.status(201).json(category);
});

router.patch("/categories/:id", async (req, res) => {
  const payload = categorySchema.partial().parse(req.body);
  const category = await CategoryModel.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!category) return res.status(404).json({ message: "Kategori bulunamadı." });
  return res.json(category);
});

router.delete("/categories/:id", async (req, res) => {
  const deleted = await CategoryModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Kategori bulunamadı." });
  return res.status(204).send();
});

router.get("/blogs", async (_req, res) => {
  const query = listQuerySchema.parse(_req.query);
  const filter = query.q
    ? {
        $or: [
          { title: { $regex: query.q, $options: "i" } },
          { slug: { $regex: query.q, $options: "i" } },
        ],
      }
    : {};
  const total = await BlogModel.countDocuments(filter);
  const rows = await BlogModel.find(filter)
    .sort({ [query.sortBy]: query.sortDir === "asc" ? 1 : -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .lean();
  return res.json({
    rows,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  });
});

router.get("/blogs/:id", async (req, res) => {
  const blog = await BlogModel.findById(req.params.id).lean();
  if (!blog) return res.status(404).json({ message: "Blog bulunamadı." });
  return res.json(blog);
});

router.post("/blogs", async (req, res) => {
  const payload = blogSchema.parse(req.body);
  const blog = await BlogModel.create({
    ...payload,
    coverImage: payload.coverImage ?? "",
    publishedAt: payload.published ? new Date() : undefined,
  });
  return res.status(201).json(blog);
});

router.patch("/blogs/:id", async (req, res) => {
  const payload = blogSchema.partial().parse(req.body);
  const blog = await BlogModel.findByIdAndUpdate(
    req.params.id,
    {
      ...payload,
      ...(payload.published ? { publishedAt: new Date() } : {}),
    },
    { new: true },
  );
  if (!blog) return res.status(404).json({ message: "Blog bulunamadı." });
  return res.json(blog);
});

router.delete("/blogs/:id", async (req, res) => {
  const deleted = await BlogModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Blog bulunamadı." });
  return res.status(204).send();
});

router.get("/discounts", async (_req, res) => {
  const query = listQuerySchema.parse(_req.query);
  const filter = query.q
    ? {
        $or: [{ code: { $regex: query.q, $options: "i" } }],
      }
    : {};
  const total = await DiscountModel.countDocuments(filter);
  const rows = await DiscountModel.find(filter)
    .sort({ [query.sortBy]: query.sortDir === "asc" ? 1 : -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .lean();
  return res.json({
    rows,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  });
});

router.get("/discounts/:id", async (req, res) => {
  const discount = await DiscountModel.findById(req.params.id).lean();
  if (!discount) return res.status(404).json({ message: "İndirim kodu bulunamadı." });
  return res.json(discount);
});

router.post("/discounts", async (req, res) => {
  const payload = discountSchema.parse(req.body);
  const discount = await DiscountModel.create({
    ...payload,
    code: payload.code.toUpperCase(),
  });
  return res.status(201).json(discount);
});

router.patch("/discounts/:id", async (req, res) => {
  const payload = discountSchema.partial().parse(req.body);
  const discount = await DiscountModel.findByIdAndUpdate(
    req.params.id,
    {
      ...payload,
      ...(payload.code ? { code: payload.code.toUpperCase() } : {}),
    },
    { new: true },
  );
  if (!discount) return res.status(404).json({ message: "İndirim kodu bulunamadı." });
  return res.json(discount);
});

router.delete("/discounts/:id", async (req, res) => {
  const deleted = await DiscountModel.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "İndirim kodu bulunamadı." });
  return res.status(204).send();
});

router.get("/orders", async (_req, res) => {
  const query = listQuerySchema.parse(_req.query);
  const filter = query.q
    ? {
        $or: [{ orderNumber: { $regex: query.q, $options: "i" } }],
      }
    : {};
  const total = await OrderModel.countDocuments(filter);
  const rows = await OrderModel.find(filter)
    .sort({ [query.sortBy]: query.sortDir === "asc" ? 1 : -1 })
    .skip((query.page - 1) * query.limit)
    .limit(query.limit)
    .lean();
  return res.json({
    rows,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  });
});

router.get("/orders/:id", async (req, res) => {
  const order = await OrderModel.findById(req.params.id).lean();
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });
  return res.json(order);
});

router.patch("/orders/:id/status", async (req, res) => {
  const payload = orderStatusSchema.parse(req.body);
  const order = await OrderModel.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!order) return res.status(404).json({ message: "Sipariş bulunamadı." });
  return res.json(order);
});

export default router;
