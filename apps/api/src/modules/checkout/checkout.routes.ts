import { Router } from "express";
import { z } from "zod";
import { DiscountModel } from "../discount/discount.model.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { ProductModel } from "../product/product.model.js";
import { OrderModel } from "../order/order.model.js";
import { stripe } from "../payments/stripe.client.js";

const router = Router();

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantSku: z.string().optional(),
        quantity: z.number().int().min(1),
        title: z.string().optional(),
        unitPrice: z.number().positive().optional(),
      }),
    )
    .min(1),
  discountCode: z.string().trim().min(2).optional(),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    line1: z.string().min(2),
    line2: z.string().optional(),
    city: z.string().min(2),
    county: z.string().optional(),
    postcode: z.string().min(3),
    country: z.string().default("GB"),
    phone: z.string().optional(),
  }),
});

const previewSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantSku: z.string().optional(),
        quantity: z.number().int().min(1),
        title: z.string().optional(),
        unitPrice: z.number().positive().optional(),
      }),
    )
    .min(1),
  discountCode: z.string().trim().min(2).optional(),
});

async function calculateCheckoutPricing(payload: z.infer<typeof previewSchema>) {
  const productIds = payload.items.map((item) => item.productId).filter((id) => /^[a-f\d]{24}$/i.test(id));
  const slugs = payload.items.map((item) => item.productId).filter((id) => !/^[a-f\d]{24}$/i.test(id));
  const products = await ProductModel.find({
    $or: [{ _id: { $in: productIds } }, { slug: { $in: slugs } }],
  }).lean();

  const orderItems = payload.items.map((item) => {
    const product = products.find((p) => String(p._id) === item.productId || p.slug === item.productId);

    if (!product && (!item.title || !item.unitPrice)) {
      throw new Error("Ürün bulunamadı. Lütfen sepeti güncelleyip tekrar deneyin.");
    }

    const variant =
      product?.variants.find((v) => v.sku === item.variantSku) ??
      product?.variants[0] ?? { sku: item.variantSku ?? "default", price: item.unitPrice ?? 0 };

    return {
      productId: item.productId,
      title: product?.title ?? item.title ?? "Ürün",
      variantSku: variant.sku,
      quantity: item.quantity,
      unitPrice: variant.price,
    };
  });

  const subtotal = orderItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  let discountAmount = 0;
  let discountCode: string | undefined;
  let discountId: string | undefined;

  if (payload.discountCode) {
    const normalized = payload.discountCode.trim().toUpperCase();
    const discount = await DiscountModel.findOne({ code: normalized }).lean();
    if (!discount || !discount.isActive) {
      throw new Error("İndirim kodu geçersiz veya aktif değil.");
    }
    if (discount.startsAt && discount.startsAt > new Date()) {
      throw new Error("İndirim kodu henüz aktif değil.");
    }
    if (discount.endsAt && discount.endsAt < new Date()) {
      throw new Error("İndirim kodunun süresi dolmuş.");
    }
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      throw new Error("İndirim kodu kullanım limitine ulaştı.");
    }
    if (subtotal < (discount.minOrderAmount ?? 0)) {
      throw new Error(`Bu kod için min. sepet tutarı £${discount.minOrderAmount}.`);
    }

    discountAmount =
      discount.type === "percentage"
        ? Number(((subtotal * discount.value) / 100).toFixed(2))
        : Math.min(discount.value, subtotal);
    discountCode = discount.code;
    discountId = String(discount._id);
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingCost = discountedSubtotal >= 90 ? 0 : 9.99;
  const total = discountedSubtotal + shippingCost;

  return {
    orderItems,
    subtotal,
    discountAmount,
    discountCode,
    discountId,
    shippingCost,
    total,
  };
}

router.post("/preview", requireAuth, async (req, res) => {
  try {
    const payload = previewSchema.parse(req.body);
    const pricing = await calculateCheckoutPricing(payload);

    return res.status(200).json({
      subtotal: pricing.subtotal,
      discountAmount: pricing.discountAmount,
      shippingCost: pricing.shippingCost,
      amount: pricing.total,
      discountCode: pricing.discountCode,
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message || "Önizleme hesaplanamadı." });
  }
});

router.post("/create-intent", requireAuth, async (req, res) => {
  const payload = checkoutSchema.parse(req.body);
  let pricing: Awaited<ReturnType<typeof calculateCheckoutPricing>>;
  try {
    pricing = await calculateCheckoutPricing({
      items: payload.items,
      discountCode: payload.discountCode,
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message || "Checkout hesaplanamadı." });
  }
  const shippingAddress = {
    fullName: payload.shippingAddress.fullName,
    line1: payload.shippingAddress.line1,
    city: payload.shippingAddress.city,
    postcode: payload.shippingAddress.postcode,
    country: payload.shippingAddress.country,
    ...(payload.shippingAddress.line2 ? { line2: payload.shippingAddress.line2 } : {}),
    ...(payload.shippingAddress.county ? { county: payload.shippingAddress.county } : {}),
    ...(payload.shippingAddress.phone ? { phone: payload.shippingAddress.phone } : {}),
  };

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: Math.round(pricing.total * 100),
      currency: "gbp",
      metadata: {
        userId: req.user!.userId,
        ...(pricing.discountCode ? { discountCode: pricing.discountCode } : {}),
        ...(pricing.discountId ? { discountId: pricing.discountId } : {}),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    },
    {
      idempotencyKey: `checkout-${req.user!.userId}-${Date.now()}`,
    },
  );

  const order = await OrderModel.create({
    orderNumber: `OVX-${Date.now()}`,
    userId: req.user!.userId,
    items: pricing.orderItems,
    shippingAddress,
    subtotal: pricing.subtotal,
    discountCode: pricing.discountCode,
    discountAmount: pricing.discountAmount,
    shippingCost: pricing.shippingCost,
    total: pricing.total,
    paymentStatus: "pending",
    stripePaymentIntentId: paymentIntent.id,
  });

  return res.status(201).json({
    clientSecret: paymentIntent.client_secret,
    orderId: String(order._id),
    subtotal: pricing.subtotal,
    discountAmount: pricing.discountAmount,
    shippingCost: pricing.shippingCost,
    amount: pricing.total,
  });
});

export default router;
