import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product-detail-view";
import { fetchCatalogProductBySlug } from "@/lib/storefront";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await fetchCatalogProductBySlug(slug);
  if (!product) notFound();

  return <ProductDetailView product={product} />;
}
