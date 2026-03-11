"use client";

import { DiscountForm } from "@/components/admin/discount-form";

export default function AdminNewDiscountPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl">Yeni İndirim Kodu</h1>
      <DiscountForm mode="create" />
    </div>
  );
}
