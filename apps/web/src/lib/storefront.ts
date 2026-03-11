"use server";

type CatalogVariant = {
  sku: string;
  price: number;
  stock?: number;
};

type CatalogReview = {
  userId?: string;
  name: string;
  rating: number;
  comment?: string;
  date: string;
};

type CatalogProduct = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  heroImage: string;
  gallery?: string[];
  specs?: string[];
  productStory?: string;
  dimensions?: string[];
  deliveryInfo?: string[];
  makerStory?: string;
  rating?: number;
  reviewCount?: number;
  addedToCartCount?: number;
  stock?: number;
  reviews?: CatalogReview[];
  variants?: CatalogVariant[];
};

export type StorefrontProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  image: string;
  category: string;
  description?: string;
  images?: string[];
  rating?: number;
  reviewCount?: number;
  addedToCartCount?: number;
  stock?: number;
  specs?: string[];
  productStory?: string;
  dimensions?: string[];
  deliveryInfo?: string[];
  makerStory?: string;
  reviews?: Array<{
    id: string;
    name: string;
    rating: number;
    comment?: string;
    date: string;
  }>;
  defaultSku?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function mapProduct(product: CatalogProduct): StorefrontProduct {
  const defaultVariant = product.variants?.[0];
  return {
    id: product._id,
    slug: product.slug,
    title: product.title,
    price: defaultVariant?.price ?? 0,
    image: product.heroImage,
    category: product.category,
    description: product.description,
    images: product.gallery?.length ? product.gallery : [product.heroImage],
    rating: product.rating ?? 0,
    reviewCount: product.reviewCount ?? 0,
    addedToCartCount: product.addedToCartCount ?? 0,
    stock: product.stock ?? defaultVariant?.stock ?? 0,
    specs: product.specs ?? [],
    productStory: product.productStory ?? "",
    dimensions: product.dimensions ?? [],
    deliveryInfo: product.deliveryInfo ?? [],
    makerStory: product.makerStory ?? "",
    reviews: (product.reviews ?? []).map((review, index) => ({
      id: `${product.slug}-${index + 1}`,
      name: review.name,
      rating: review.rating,
      comment: review.comment,
      date: review.date,
    })),
    defaultSku: defaultVariant?.sku ?? "default",
  };
}

export async function fetchCatalogProducts(category?: string) {
  const query = category ? `?category=${encodeURIComponent(category)}` : "";
  const response = await fetch(`${API_URL}/api/catalog/products${query}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Ürünler alınamadı.");
  const data = (await response.json()) as CatalogProduct[];
  return data.map(mapProduct);
}

export async function fetchCatalogProductBySlug(slug: string) {
  const response = await fetch(`${API_URL}/api/catalog/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });
  if (!response.ok) return null;
  const data = (await response.json()) as CatalogProduct;
  return mapProduct(data);
}
