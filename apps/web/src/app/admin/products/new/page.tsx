"use client";

import { ProductForm } from "@/components/admin/product-form";

export default function AdminNewProductPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl">Yeni Ürün</h1>
      <ProductForm mode="create" />
    </div>
  );
}
