import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { OrderModel } from "../order/order.model.js";
import { ProductModel } from "../product/product.model.js";

const router = Router();

const productCreateSchema = z.object({
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

router.get("/products", async (req, res) => {
  const category = req.query.category as string | undefined;
  const featured = req.query.featured === "true";
  const query = category ? { category } : featured ? { featured: true } : {};

  const products = await ProductModel.find(query).sort({ createdAt: -1 }).lean();
  return res.json(products);
});

router.get("/products/:slug", async (req, res) => {
  const product = await ProductModel.findOne({ slug: req.params.slug }).lean();
  if (!product) {
    return res.status(404).json({ message: "Ürün bulunamadı." });
  }

  return res.json(product);
});

router.post("/products/:slug/cart-hit", requireAuth, async (req, res) => {
  const product = await ProductModel.findOneAndUpdate(
    { slug: req.params.slug },
    { $inc: { addedToCartCount: 1 } },
    { new: true },
  ).lean();
  if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });
  return res.json({ addedToCartCount: product.addedToCartCount ?? 0 });
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

router.post("/products/:slug/reviews", requireAuth, async (req, res) => {
  const payload = reviewSchema.parse(req.body);
  const product = await ProductModel.findOne({ slug: req.params.slug });
  if (!product) return res.status(404).json({ message: "Ürün bulunamadı." });

  const hasPaidOrder = await OrderModel.exists({
    userId: req.user!.userId,
    paymentStatus: "paid",
    $or: [{ "items.productId": req.params.slug }, { "items.productId": String(product._id) }],
  });
  if (!hasPaidOrder) {
    return res.status(403).json({ message: "Yorum ve puan için bu ürünü satın almış olmalısınız." });
  }

  const nameFromEmail = req.user!.email.split("@")[0];
  const nextReview = {
    userId: req.user!.userId,
    name: nameFromEmail,
    rating: payload.rating,
    comment: payload.comment?.trim() ?? "",
    date: new Date().toISOString().slice(0, 10),
  };

  const existingIndex = product.reviews.findIndex((review) => String(review.userId) === req.user!.userId);
  if (existingIndex >= 0) {
    product.reviews[existingIndex] = nextReview as never;
  } else {
    product.reviews.push(nextReview as never);
  }

  const reviewCount = product.reviews.length;
  const ratingAvg = reviewCount
    ? Number((product.reviews.reduce((acc, review) => acc + review.rating, 0) / reviewCount).toFixed(1))
    : 0;

  product.reviewCount = reviewCount;
  product.rating = ratingAvg;
  await product.save();

  return res.status(201).json({ reviewCount, rating: ratingAvg });
});

router.post("/products", async (req, res) => {
  const payload = productCreateSchema.parse(req.body);
  const product = await ProductModel.create(payload);
  return res.status(201).json(product);
});

export default router;
