"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { DiscountForm } from "@/components/admin/discount-form";
import { adminRequest } from "@/lib/admin-api";

export default function AdminEditDiscountPage() {
  const params = useParams<{ id: string }>();
  const discountId = params.id;

  const state = useQuery({
    queryKey: ["admin-discount-edit", discountId],
    queryFn: () =>
      adminRequest<{
        _id: string;
        code: string;
        type: "percentage" | "fixed";
        value: number;
        minOrderAmount: number;
        usageLimit?: number;
        usageCount: number;
        isActive: boolean;
        startsAt?: string;
        endsAt?: string;
      }>(`/api/admin/discounts/${discountId}`),
    enabled: Boolean(discountId),
  });

  if (state.isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>;
  if (!state.data) return <div className="text-sm text-destructive">İndirim kodu bulunamadı.</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl">İndirim Kodu Düzenle</h1>
      <DiscountForm
        mode="edit"
        discountId={state.data._id}
        initial={{
          code: state.data.code,
          type: state.data.type,
          value: state.data.value,
          minOrderAmount: state.data.minOrderAmount,
          usageLimit: state.data.usageLimit ?? "",
          usageCount: state.data.usageCount,
          isActive: state.data.isActive,
          startsAt: state.data.startsAt ? new Date(state.data.startsAt).toISOString().slice(0, 16) : "",
          endsAt: state.data.endsAt ? new Date(state.data.endsAt).toISOString().slice(0, 16) : "",
        }}
      />
    </div>
  );
}
