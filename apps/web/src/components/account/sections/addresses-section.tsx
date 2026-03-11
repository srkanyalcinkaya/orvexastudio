"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { accountRequest } from "@/lib/account-api";

type Address = {
  _id: string;
  title: string;
  addressType: "shipping" | "billing" | "both";
  fullName: string;
  phone: string;
  line1: string;
  county?: string;
  city: string;
  postcode: string;
  country: string;
  isDefault: boolean;
};

export function AddressesSection() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    addressType: "shipping" as "shipping" | "billing" | "both",
    fullName: "",
    phone: "",
    line1: "",
    county: "",
    city: "",
    postcode: "",
    country: "GB",
  });
  const [postcodeLoading, setPostcodeLoading] = useState(false);

  const addresses = useQuery({
    queryKey: ["account-addresses"],
    queryFn: () => accountRequest<Address[]>("/api/account/addresses"),
  });

  const createMutation = useMutation({
    mutationFn: () => accountRequest<Address>("/api/account/addresses", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => {
      setForm({
        title: "",
        addressType: "shipping",
        fullName: "",
        phone: "",
        line1: "",
        county: "",
        city: "",
        postcode: "",
        country: "GB",
      });
      setOpen(false);
      void qc.invalidateQueries({ queryKey: ["account-addresses"] });
      toast.success("Adres eklendi.");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  useEffect(() => {
    const code = form.postcode.trim();
    if (code.length < 5) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setPostcodeLoading(true);
        const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(code)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const body = (await response.json()) as {
          result?: { admin_district?: string; admin_county?: string; region?: string };
        };
        const result = body.result;
        if (!result) return;
        setForm((prev) => ({
          ...prev,
          city: prev.city || result.admin_district || "",
          county: prev.county || result.admin_county || result.region || "",
          country: "GB",
        }));
      } catch {
        // postcode autocomplete opsiyonel
      } finally {
        setPostcodeLoading(false);
      }
    }, 450);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [form.postcode]);

  const deleteAddress = async (id: string) => {
    await accountRequest(`/api/account/addresses/${id}`, { method: "DELETE" });
    await qc.invalidateQueries({ queryKey: ["account-addresses"] });
    toast.success("Adres silindi.");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Adreslerim</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button />}>Yeni Adres Ekle</DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Yeni Adres</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Adres başlığı (Ev, Ofis...)"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                />
                <select
                  className="h-9 rounded border bg-background px-3 text-sm"
                  value={form.addressType}
                  onChange={(e) => setForm((p) => ({ ...p, addressType: e.target.value as "shipping" | "billing" | "both" }))}
                >
                  <option value="shipping">Kargo Adresi</option>
                  <option value="billing">Fatura Adresi</option>
                  <option value="both">Kargo + Fatura</option>
                </select>
                <Input
                  placeholder="Ad Soyad"
                  value={form.fullName}
                  onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                />
                <Input placeholder="Telefon" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                <Input
                  className="md:col-span-2"
                  placeholder="Adres satırı"
                  value={form.line1}
                  onChange={(e) => setForm((p) => ({ ...p, line1: e.target.value }))}
                />
                <Input
                  placeholder="Postcode"
                  value={form.postcode}
                  onChange={(e) => setForm((p) => ({ ...p, postcode: e.target.value.toUpperCase() }))}
                />
                <Input placeholder="Şehir" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} />
                <Input placeholder="County" value={form.county} onChange={(e) => setForm((p) => ({ ...p, county: e.target.value }))} />
                <Input value="İngiltere (GB)" disabled />
                {postcodeLoading ? (
                  <p className="text-xs text-muted-foreground md:col-span-2">Postcode ile şehir/county otomatik getiriliyor...</p>
                ) : null}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={
                    createMutation.isPending ||
                    form.title.trim().length < 2 ||
                    form.fullName.trim().length < 2 ||
                    form.phone.trim().length < 6 ||
                    form.line1.trim().length < 2 ||
                    form.city.trim().length < 2 ||
                    form.postcode.trim().length < 2
                  }
                >
                  Adresi Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Adreslerinizi buradan yönetin.
        </CardContent>
      </Card>

      {addresses.data?.map((address) => (
        <Card key={address._id}>
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <div>
              <p className="font-medium">
                {address.title} - {address.addressType === "shipping" ? "Kargo" : address.addressType === "billing" ? "Fatura" : "Kargo+Fatura"}
              </p>
              <p>{address.fullName}</p>
              <p className="text-muted-foreground">
                {address.line1}, {address.city} {address.postcode} {address.county ? `- ${address.county}` : ""}
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => void deleteAddress(address._id)}>
              Sil
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
