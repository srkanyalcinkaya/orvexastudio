import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response) {
  return res.status(404).json({ message: "Route bulunamadı." });
}

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  void _next;
  const isValidationError = error.name === "ZodError" || error.name === "ValidationError";
  const statusCode = isValidationError ? 400 : 500;

  return res.status(statusCode).json({
    message: error.message || "Sunucu hatası oluştu.",
  });
}
