import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { comparePassword, hashPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/auth.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { UserModel } from "../user/user.model.js";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

const registerSchema = loginSchema.extend({
  fullName: z.string().min(2),
});

router.post("/register", async (req, res) => {
  const payload = registerSchema.parse(req.body);
  const existingUser = await UserModel.findOne({ email: payload.email });
  if (existingUser) {
    return res.status(409).json({ message: "Bu e-posta zaten kayıtlı." });
  }

  const passwordHash = await hashPassword(payload.password);
  const roles = payload.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase() ? ["customer", "admin"] : ["customer"];
  const user = await UserModel.create({ email: payload.email, passwordHash, roles, fullName: payload.fullName });

  const accessToken = signAccessToken({ userId: user.id, email: user.email, roles: user.roles });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email, roles: user.roles });

  user.refreshTokenHash = await hashPassword(refreshToken);
  await user.save();

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res
    .status(201)
    .json({ accessToken, user: { id: user.id, email: user.email, roles: user.roles, fullName: user.fullName ?? "" } });
});

router.post("/login", async (req, res) => {
  const payload = loginSchema.parse(req.body);
  const user = await UserModel.findOne({ email: payload.email });
  if (!user) {
    return res.status(401).json({ message: "Geçersiz kullanıcı bilgisi." });
  }

  const validPassword = await comparePassword(payload.password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: "Geçersiz kullanıcı bilgisi." });
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email, roles: user.roles });
  const refreshToken = signRefreshToken({ userId: user.id, email: user.email, roles: user.roles });

  user.refreshTokenHash = await hashPassword(refreshToken);
  await user.save();

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return res.json({ accessToken, user: { id: user.id, email: user.email, roles: user.roles, fullName: user.fullName ?? "" } });
});

router.post("/refresh", async (req, res) => {
  const token = req.cookies.refresh_token as string | undefined;
  if (!token) {
    return res.status(401).json({ message: "Refresh token bulunamadı." });
  }

  const decoded = verifyRefreshToken(token);
  const user = await UserModel.findById(decoded.userId);
  if (!user || !user.refreshTokenHash) {
    return res.status(401).json({ message: "Refresh token geçersiz." });
  }

  const isTokenValid = await comparePassword(token, user.refreshTokenHash);
  if (!isTokenValid) {
    return res.status(401).json({ message: "Refresh token geçersiz." });
  }

  const accessToken = signAccessToken({ userId: user.id, email: user.email, roles: user.roles });
  return res.json({ accessToken });
});

router.post("/logout", async (req, res) => {
  const token = req.cookies.refresh_token as string | undefined;
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      await UserModel.findByIdAndUpdate(decoded.userId, { refreshTokenHash: null });
    } catch {
      // no-op
    }
  }

  res.clearCookie("refresh_token");
  return res.status(204).send();
});

router.get("/me", requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.user!.userId).lean();
  if (!user) {
    return res.status(404).json({ message: "Kullanıcı bulunamadı." });
  }

  return res.json({
    id: String(user._id),
    email: user.email,
    roles: user.roles ?? ["customer"],
  });
});

export default router;
