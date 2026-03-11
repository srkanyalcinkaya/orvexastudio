import { Router } from "express";
import { z } from "zod";
import { comparePassword, hashPassword } from "../../lib/auth.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { ProductModel } from "../product/product.model.js";
import { UserModel } from "../user/user.model.js";
import { AddressModel } from "./address.model.js";
import { SupportTicketModel } from "./support-ticket.model.js";
import { WishlistModel } from "./wishlist.model.js";

const router = Router();
router.use(requireAuth);

const addressSchema = z.object({
  title: z.string().min(2),
  addressType: z.enum(["shipping", "billing", "both"]).default("shipping"),
  fullName: z.string().min(2),
  phone: z.string().min(6),
  line1: z.string().min(2),
  line2: z.string().optional(),
  city: z.string().min(2),
  county: z.string().optional(),
  postcode: z.string().min(2),
  country: z.string().min(2).default("GB"),
  isDefault: z.boolean().default(false),
});

const profileSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().min(6).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(8).max(72),
  newPassword: z.string().min(8).max(72),
});

const wishlistSchema = z.object({
  productId: z.string().min(2),
});

const supportTicketSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(10),
});

router.get("/profile", async (req, res) => {
  const user = await UserModel.findById(req.user!.userId).lean();
  if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  return res.json({
    id: String(user._id),
    email: user.email,
    fullName: user.fullName ?? "",
    phone: user.phone ?? "",
    roles: user.roles ?? ["customer"],
  });
});

router.patch("/profile", async (req, res) => {
  const payload = profileSchema.parse(req.body);
  const user = await UserModel.findByIdAndUpdate(req.user!.userId, payload, { new: true }).lean();
  if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  return res.json({
    id: String(user._id),
    email: user.email,
    fullName: user.fullName ?? "",
    phone: user.phone ?? "",
    roles: user.roles ?? ["customer"],
  });
});

router.post("/change-password", async (req, res) => {
  const payload = passwordSchema.parse(req.body);
  const user = await UserModel.findById(req.user!.userId);
  if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  const valid = await comparePassword(payload.currentPassword, user.passwordHash);
  if (!valid) return res.status(400).json({ message: "Mevcut şifre yanlış." });
  user.passwordHash = await hashPassword(payload.newPassword);
  await user.save();
  return res.status(204).send();
});

router.get("/addresses", async (req, res) => {
  const rows = await AddressModel.find({ userId: req.user!.userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  return res.json(rows);
});

router.post("/addresses", async (req, res) => {
  const payload = addressSchema.parse(req.body);
  if (payload.isDefault) {
    await AddressModel.updateMany({ userId: req.user!.userId }, { isDefault: false });
  }
  const created = await AddressModel.create({ ...payload, userId: req.user!.userId });
  return res.status(201).json(created);
});

router.patch("/addresses/:id", async (req, res) => {
  const payload = addressSchema.partial().parse(req.body);
  if (payload.isDefault) {
    await AddressModel.updateMany({ userId: req.user!.userId }, { isDefault: false });
  }
  const updated = await AddressModel.findOneAndUpdate(
    { _id: req.params.id, userId: req.user!.userId },
    payload,
    { new: true },
  ).lean();
  if (!updated) return res.status(404).json({ message: "Adres bulunamadı." });
  return res.json(updated);
});

router.delete("/addresses/:id", async (req, res) => {
  const deleted = await AddressModel.findOneAndDelete({ _id: req.params.id, userId: req.user!.userId }).lean();
  if (!deleted) return res.status(404).json({ message: "Adres bulunamadı." });
  return res.status(204).send();
});

router.get("/wishlist", async (req, res) => {
  const wishlist = await WishlistModel.findOne({ userId: req.user!.userId }).lean();
  const productIds = wishlist?.productIds ?? [];
  if (productIds.length === 0) return res.json({ productIds: [], products: [] });
  const products = await ProductModel.find({
    $or: [{ slug: { $in: productIds } }, { _id: { $in: productIds.filter((id) => /^[a-f\d]{24}$/i.test(id)) } }],
  }).lean();
  return res.json({ productIds, products });
});

router.post("/wishlist", async (req, res) => {
  const payload = wishlistSchema.parse(req.body);
  const wishlist = await WishlistModel.findOneAndUpdate(
    { userId: req.user!.userId },
    { $addToSet: { productIds: payload.productId } },
    { upsert: true, new: true },
  ).lean();
  return res.status(201).json(wishlist);
});

router.delete("/wishlist/:productId", async (req, res) => {
  const wishlist = await WishlistModel.findOneAndUpdate(
    { userId: req.user!.userId },
    { $pull: { productIds: req.params.productId } },
    { new: true },
  ).lean();
  return res.json(wishlist ?? { productIds: [] });
});

router.get("/reviews", async (req, res) => {
  const products = await ProductModel.find({ "reviews.userId": req.user!.userId }).lean();
  const rows = products.flatMap((product) =>
    (product.reviews ?? [])
      .filter((review) => String(review.userId) === req.user!.userId)
      .map((review, index) => ({
        id: `${product.slug}-${index}`,
        productId: String(product._id),
        productSlug: product.slug,
        productTitle: product.title,
        heroImage: product.heroImage,
        rating: review.rating,
        comment: review.comment ?? "",
        date: review.date,
      })),
  );
  return res.json(rows);
});

router.get("/support-tickets", async (req, res) => {
  const rows = await SupportTicketModel.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).lean();
  return res.json(rows);
});

router.post("/support-tickets", async (req, res) => {
  const payload = supportTicketSchema.parse(req.body);
  const created = await SupportTicketModel.create({ ...payload, userId: req.user!.userId });
  return res.status(201).json(created);
});

export default router;
