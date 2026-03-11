import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { OrderModel } from "../order/order.model.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const orders = await OrderModel.find({ userId: req.user!.userId })
    .sort({ createdAt: -1 })
    .lean();

  return res.json(orders);
});

router.get("/:orderId", requireAuth, async (req, res) => {
  const order = await OrderModel.findOne({
    _id: req.params.orderId,
    userId: req.user!.userId,
  }).lean();

  if (!order) {
    return res.status(404).json({ message: "Sipariş bulunamadı." });
  }

  return res.json(order);
});

export default router;
