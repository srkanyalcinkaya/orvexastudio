"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminRequest } from "@/lib/admin-api";

export type DiscountPayload = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrderAmount: number;
  usageLimit: number | "";
  usageCount: number;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

export function DiscountForm({
  mode,
  discountId,
  initial,
}: {
  mode: "create" | "edit";
  discountId?: string;
  initial?: DiscountPayload;
}) {
  const router = useRouter();
  const [state, setState] = useState<DiscountPayload>(
    initial ?? {
      code: "",
      type: "percentage",
      value: 10,
      minOrderAmount: 0,
      usageLimit: "",
      usageCount: 0,
      isActive: true,
      startsAt: "",
      endsAt: "",
    },
  );

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        code: state.code.toUpperCase(),
        type: state.type,
        value: Number(state.value),
        minOrderAmount: Number(state.minOrderAmount),
        usageLimit: state.usageLimit === "" ? undefined : Number(state.usageLimit),
        isActive: state.isActive,
        startsAt: state.startsAt || undefined,
        endsAt: state.endsAt || undefined,
      };
      if (mode === "create") {
        return adminRequest("/api/admin/discounts", { method: "POST", body: JSON.stringify(payload) });
      }
      return adminRequest(`/api/admin/discounts/${discountId}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Kod oluşturuldu." : "Kod güncellendi.");
      router.push("/admin/discounts");
      router.refresh();
    },
    onError: () => toast.error("Kaydetme başarısız."),
  });

  return (
    <div className="space-y-4 rounded-sm border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Kod</Label>
          <Input value={state.code} onChange={(e) => setState((p) => ({ ...p, code: e.target.value.toUpperCase() }))} />
        </div>
        <div className="space-y-1">
          <Label>Tip</Label>
          <select
            className="w-full rounded border bg-background p-2 text-sm"
            value={state.type}
            onChange={(e) => setState((p) => ({ ...p, type: e.target.value as "percentage" | "fixed" }))}
          >
            <option value="percentage">percentage</option>
            <option value="fixed">fixed</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label>Değer</Label>
          <Input
            type="number"
            value={state.value}
            onChange={(e) => setState((p) => ({ ...p, value: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Min sepet tutarı</Label>
          <Input
            type="number"
            value={state.minOrderAmount}
            onChange={(e) => setState((p) => ({ ...p, minOrderAmount: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Kullanım limiti</Label>
          <Input
            type="number"
            value={state.usageLimit}
            onChange={(e) => setState((p) => ({ ...p, usageLimit: e.target.value === "" ? "" : Number(e.target.value) }))}
            placeholder="Boşsa sınırsız"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label>Başlangıç</Label>
          <Input
            type="datetime-local"
            value={state.startsAt}
            onChange={(e) => setState((p) => ({ ...p, startsAt: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Bitiş</Label>
          <Input
            type="datetime-local"
            value={state.endsAt}
            onChange={(e) => setState((p) => ({ ...p, endsAt: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Durum</Label>
          <select
            className="w-full rounded border bg-background p-2 text-sm"
            value={state.isActive ? "1" : "0"}
            onChange={(e) => setState((p) => ({ ...p, isActive: e.target.value === "1" }))}
          >
            <option value="1">Aktif</option>
            <option value="0">Pasif</option>
          </select>
        </div>
      </div>

      <div className="rounded border p-3 text-sm text-muted-foreground">
        Kullanım: <strong>{state.usageCount}</strong> kez kullanılmış.
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push("/admin/discounts")}>
          Vazgeç
        </Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !state.code}>
          {mode === "create" ? "Kod Oluştur" : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </div>
  );
}
