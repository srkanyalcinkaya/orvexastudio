export const CART_STORAGE_KEY = "orvexa_cart_items";

export type CartItem = {
  productId: string;
  slug: string;
  title: string;
  image: string;
  price: number;
  quantity: number;
  variantSku: string;
};

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<CartItem>;
  return Boolean(
    item.productId &&
      item.slug &&
      item.title &&
      item.image &&
      typeof item.price === "number" &&
      typeof item.quantity === "number",
  );
}

export function readCartItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(CART_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    if (parsed.length === 0) return [];
    if (typeof parsed[0] === "string") return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function writeCartItems(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function addCartItem(item: Omit<CartItem, "quantity">, qty = 1) {
  const cart = readCartItems();
  const existing = cart.find((c) => c.slug === item.slug && c.variantSku === item.variantSku);
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({ ...item, quantity: qty });
  }
  writeCartItems(cart);
  return cart;
}

export function removeCartItem(slug: string, variantSku: string) {
  const cart = readCartItems().filter((item) => !(item.slug === slug && item.variantSku === variantSku));
  writeCartItems(cart);
  return cart;
}

export function updateCartItemQuantity(slug: string, variantSku: string, quantity: number) {
  const cart = readCartItems()
    .map((item) => (item.slug === slug && item.variantSku === variantSku ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);
  writeCartItems(cart);
  return cart;
}
