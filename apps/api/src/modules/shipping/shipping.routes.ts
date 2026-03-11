import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { OrderModel } from "../order/order.model.js";
import { createRoyalMailLabel } from "./royalmail.service.js";

const router = Router();

router.post("/orders/:orderId/label", requireAuth, async (req, res) => {
  const order = await OrderModel.findOne({ _id: req.params.orderId, userId: req.user!.userId });
  if (!order) {
    return res.status(404).json({ message: "Sipariş bulunamadı." });
  }

  const label = await createRoyalMailLabel({
    orderNumber: order.orderNumber,
    recipientName: order.shippingAddress.fullName,
    postcode: order.shippingAddress.postcode,
  });

  order.shippingProvider = "royal_mail";
  order.shippingStatus = "label_created";
  order.trackingNumber = label.trackingNumber;
  order.shippingLabelUrl = label.labelUrl;
  await order.save();

  return res.json({
    orderId: order.id,
    trackingNumber: order.trackingNumber,
    shippingLabelUrl: order.shippingLabelUrl,
  });
});

router.get("/orders/:orderId/tracking", requireAuth, async (req, res) => {
  const order = await OrderModel.findOne({ _id: req.params.orderId, userId: req.user!.userId }).lean();
  if (!order) {
    return res.status(404).json({ message: "Sipariş bulunamadı." });
  }

  return res.json({
    shippingStatus: order.shippingStatus,
    trackingNumber: order.trackingNumber,
    provider: order.shippingProvider,
  });
});

export default router;
