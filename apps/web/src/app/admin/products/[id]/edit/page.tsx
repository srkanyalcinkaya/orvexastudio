"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProductForm } from "@/components/admin/product-form";
import { adminRequest } from "@/lib/admin-api";

export default function AdminEditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const state = useQuery({
    queryKey: ["admin-product-edit", productId],
    queryFn: () =>
      adminRequest<{
        _id: string;
        title: string;
        slug: string;
        description: string;
        category: string;
        heroImage: string;
        gallery?: string[];
        specs?: string[];
        productStory?: string;
        dimensions?: string[];
        deliveryInfo?: string[];
        makerStory?: string;
        featured: boolean;
        stock?: number;
        variants?: Array<{ price?: number; stock?: number }>;
      }>(`/api/admin/products/${productId}`),
    enabled: Boolean(productId),
  });

  if (state.isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>;
  if (!state.data) return <div className="text-sm text-destructive">Ürün bulunamadı.</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl">Ürün Düzenle</h1>
      <ProductForm
        mode="edit"
        productId={state.data._id}
        initial={{
          title: state.data.title,
          slug: state.data.slug,
          description: state.data.description,
          category: state.data.category,
          heroImage: state.data.heroImage,
          gallery: state.data.gallery ?? [],
          infoItemsText: (state.data.specs ?? []).join("\n"),
          productStory: state.data.productStory ?? "",
          dimensionsText: (state.data.dimensions ?? []).join("\n"),
          deliveryInfoText: (state.data.deliveryInfo ?? []).join("\n"),
          makerStory: state.data.makerStory ?? "",
          featured: state.data.featured,
          price: state.data.variants?.[0]?.price ?? 55,
          stock: state.data.stock ?? state.data.variants?.[0]?.stock ?? 20,
        }}
      />
    </div>
  );
}
