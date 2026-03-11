import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../lib/auth.js";
import { UserModel } from "../modules/user/user.model.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ message: "Yetkisiz erişim." });
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await UserModel.findById(decoded.userId).lean();
    if (!user) {
      return res.status(401).json({ message: "Kullanıcı bulunamadı." });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles: user.roles ?? ["customer"],
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Token geçersiz veya süresi dolmuş." });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const roles = req.user?.roles ?? [];
  if (!roles.includes("admin")) {
    return res.status(403).json({ message: "Admin yetkisi gerekli." });
  }
  return next();
}
