"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readCartItems, type CartItem } from "@/lib/cart-storage";
import { accountRequest } from "@/lib/account-api";
import { apiGet, apiPost } from "@/lib/api";

const formSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(8),
  fullName: z.string().min(2),
  line1: z.string().min(3),
  line2: z.string().optional(),
  city: z.string().min(2),
  county: z.string().optional(),
  postcode: z.string().min(3),
  country: z.string().min(2),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type CheckoutIntentResponse = {
  clientSecret: string;
  amount: number;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
};
type CheckoutPreviewResponse = {
  amount: number;
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  discountCode?: string;
};

export type CheckoutSummary = {
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  amount: number;
};

type SavedAddress = {
  _id: string;
  title: string;
  addressType: "shipping" | "billing" | "both";
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  county?: string;
  postcode: string;
  country: string;
  isDefault: boolean;
};

function StripePaymentSection({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const onPay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/account?checkout=success`,
      },
    });
    setSubmitting(false);

    if (result.error) {
      toast.error(result.error.message ?? "Ödeme doğrulanamadı.");
      return;
    }
    toast.success("Ödeme başarıyla tamamlandı.");
  };

  return (
    <div className="space-y-3 rounded border p-3">
      <p className="text-sm text-muted-foreground">Gerçek kart girişini Stripe güvenli alanında yapabilirsiniz.</p>
      <PaymentElement />
      <Button type="button" className="w-full" disabled={!stripe || !elements || submitting} onClick={onPay}>
        {submitting ? "Ödeme alınıyor..." : "Kartla Öde"}
      </Button>
      <p className="text-xs text-muted-foreground">`stripe listen` aktifse webhook ile sipariş paid'e düşer.</p>
      <input type="hidden" value={clientSecret} readOnly />
    </div>
  );
}

export function CheckoutForm({ onSummaryChange }: { onSummaryChange?: (summary: CheckoutSummary) => void }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [intentData, setIntentData] = useState<CheckoutIntentResponse | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  useEffect(() => {
    const items = readCartItems();
    setCartItems(items);
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shippingCost = subtotal >= 90 ? 0 : 9.99;
    onSummaryChange?.({
      subtotal,
      discountAmount: 0,
      shippingCost,
      amount: subtotal + shippingCost,
    });
  }, [onSummaryChange]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      phone: "",
      country: "GB",
    },
  });

  const stripeConfigQuery = useQuery({
    queryKey: ["stripe-config"],
    queryFn: () => apiGet<{ publishableKey: string }>("/api/payments/config"),
  });

  const stripePromise = useMemo(() => {
    const key = stripeConfigQuery.data?.publishableKey;
    if (!key) return null;
    return loadStripe(key);
  }, [stripeConfigQuery.data?.publishableKey]);

  const addressesQuery = useQuery({
    queryKey: ["checkout-saved-addresses"],
    queryFn: () => accountRequest<SavedAddress[]>("/api/account/addresses"),
  });

  useEffect(() => {
    const rows = addressesQuery.data ?? [];
    if (rows.length === 0) return;
    const selected = rows.find((a) => a._id === selectedAddressId) ?? rows.find((a) => a.isDefault) ?? rows[0];
    if (!selected) return;
    setSelectedAddressId(selected._id);
    form.setValue("fullName", selected.fullName);
    form.setValue("phone", selected.phone);
    form.setValue("line1", selected.line1);
    form.setValue("line2", selected.line2 ?? "");
    form.setValue("city", selected.city);
    form.setValue("county", selected.county ?? "");
    form.setValue("postcode", selected.postcode);
    form.setValue("country", selected.country || "GB");
  }, [addressesQuery.data, selectedAddressId, form]);

  const checkoutMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (cartItems.length === 0) {
        throw new Error("Sepet boş. Önce ürün ekleyin.");
      }
      return apiPost<CheckoutIntentResponse>("/api/checkout/create-intent", {
        items: cartItems.map((item) => ({
          productId: item.slug,
          variantSku: item.variantSku,
          quantity: item.quantity,
          title: item.title,
          unitPrice: item.price,
        })),
        discountCode: discountCode.trim() || undefined,
        shippingAddress: {
          fullName: values.fullName,
          line1: values.line1,
          line2: values.line2,
          city: values.city,
          county: values.county,
          postcode: values.postcode,
          country: values.country,
          phone: values.phone,
        },
      });
    },
    onSuccess: async (data) => {
      if (!stripePromise || !data.clientSecret) {
        toast.error("Stripe publishable key eksik. Lütfen ayarları kontrol edin.");
        return;
      }
      setIntentData(data);
      onSummaryChange?.({
        subtotal: data.subtotal,
        discountAmount: data.discountAmount,
        shippingCost: data.shippingCost,
        amount: data.amount,
      });
      toast.success("Ödeme hazır. Kart bilgilerinizi girip ödemeyi tamamlayın.");
    },
    onError: (error) => {
      toast.error(error.message || "Checkout isteği başarısız.");
    },
  });

  const previewMutation = useMutation({
    mutationFn: async () => {
      if (cartItems.length === 0) {
        throw new Error("Sepet boş. Önce ürün ekleyin.");
      }
      return apiPost<CheckoutPreviewResponse>("/api/checkout/preview", {
        items: cartItems.map((item) => ({
          productId: item.slug,
          variantSku: item.variantSku,
          quantity: item.quantity,
          title: item.title,
          unitPrice: item.price,
        })),
        discountCode: discountCode.trim() || undefined,
      });
    },
    onSuccess: (data) => {
      onSummaryChange?.({
        subtotal: data.subtotal,
        discountAmount: data.discountAmount,
        shippingCost: data.shippingCost,
        amount: data.amount,
      });
      if (data.discountAmount > 0) {
        toast.success(`Kod uygulandı: -£${data.discountAmount.toFixed(2)}`);
      } else if (discountCode.trim()) {
        toast.info("Kod geçerli ama bu sepet için indirim oluşmadı.");
      } else {
        toast.success("Fiyatlar güncellendi.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Kod doğrulanamadı.");
    },
  });

  const stripeOptions = useMemo(
    () =>
      intentData
        ? {
            clientSecret: intentData.clientSecret,
            appearance: { theme: "stripe" as const },
          }
        : null,
    [intentData],
  );

  const paymentNode = stripeOptions ? (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <StripePaymentSection clientSecret={intentData!.clientSecret} />
    </Elements>
  ) : (
    <div className="space-y-2 rounded border p-3 text-sm">
      <p className="text-muted-foreground">Ödeme alanı, ödeme intent oluşturulduğunda burada görünecek.</p>
    </div>
  );

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => {
        checkoutMutation.mutate(values);
      })}
    >
      <div className="space-y-2 rounded border p-3">
        <p className="text-sm font-medium">Kayıtlı adresler</p>
        {addressesQuery.isLoading ? <p className="text-sm text-muted-foreground">Adresler yükleniyor...</p> : null}
        {!addressesQuery.isLoading && (addressesQuery.data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Kayıtlı adres bulunamadı. Aşağıdan manuel girebilirsiniz.</p>
        ) : null}
        {(addressesQuery.data?.length ?? 0) > 0 ? (
          <select
            className="h-10 w-full rounded border bg-background px-3 text-sm"
            value={selectedAddressId}
            onChange={(e) => setSelectedAddressId(e.target.value)}
          >
            <option value="">Kayıtlı adres seçin</option>
            {(addressesQuery.data ?? []).map((address) => (
              <option key={address._id} value={address._id}>
                {address.title} - {address.fullName} ({address.city} {address.postcode})
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register("phone")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" {...form.register("fullName")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="line1">Address line 1</Label>
        <Input id="line1" {...form.register("line1")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="line2">Address line 2 (optional)</Label>
        <Input id="line2" {...form.register("line2")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" {...form.register("city")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="county">County (optional)</Label>
          <Input id="county" {...form.register("county")} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode</Label>
          <Input id="postcode" {...form.register("postcode")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" {...form.register("country")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Delivery notes (optional)</Label>
        <Input id="notes" {...form.register("notes")} />
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto]">
        <div className="space-y-2">
          <Label htmlFor="discountCode">Discount code</Label>
          <Input
            id="discountCode"
            placeholder="WELCOME10"
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            className="w-full md:w-auto"
            onClick={() => previewMutation.mutate()}
            disabled={previewMutation.isPending || cartItems.length === 0}
          >
            {previewMutation.isPending ? "Kontrol ediliyor..." : "Kodu Uygula"}
          </Button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={checkoutMutation.isPending || cartItems.length === 0}>
        {checkoutMutation.isPending ? "Ödeme hazırlanıyor..." : "Stripe Ödemesini Hazırla"}
      </Button>
      {!stripeConfigQuery.isLoading && !stripeConfigQuery.data?.publishableKey ? (
        <p className="text-sm text-destructive">
          Stripe publishable key bulunamadı. API env içinde `STRIPE_PUBLIC_KEY` değerini kontrol edin.
        </p>
      ) : null}
      {cartItems.length === 0 ? <p className="text-sm text-muted-foreground">Sepet boş olduğu için ödeme başlatılamaz.</p> : null}

      {typeof document !== "undefined" && document.getElementById("checkout-payment-slot")
        ? createPortal(paymentNode, document.getElementById("checkout-payment-slot")!)
        : null}
    </form>
  );
}
