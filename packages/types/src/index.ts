export type Currency = "GBP";

export interface Money {
  amount: number;
  currency: Currency;
}

export interface ProductVariant {
  sku: string;
  title: string;
  stemCount?: number;
  color?: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  heroImage: string;
  gallery: string[];
  featured: boolean;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
}

export interface Address {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  phone?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  shippingStatus: "pending" | "label_created" | "in_transit" | "delivered";
  trackingNumber?: string;
  shippingProvider?: "royal_mail";
}
