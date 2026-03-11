import { Router } from "express";
import { env } from "../../config/env.js";
import { DiscountModel } from "../discount/discount.model.js";
import { OrderModel } from "../order/order.model.js";
import { stripe } from "./stripe.client.js";

const router = Router();

router.get("/config", (_req, res) => {
  return res.json({ publishableKey: env.STRIPE_PUBLIC_KEY });
});

router.post("/webhook", async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(400).send("Eksik stripe imzası");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).send(`Webhook doğrulama hatası: ${(error as Error).message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    await OrderModel.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { paymentStatus: "paid" },
    );
    const discountId = paymentIntent.metadata?.discountId;
    if (discountId) {
      await DiscountModel.findByIdAndUpdate(discountId, { $inc: { usageCount: 1 } });
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object;
    await OrderModel.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { paymentStatus: "failed" },
    );
  }

  return res.json({ received: true });
});

export default router;
