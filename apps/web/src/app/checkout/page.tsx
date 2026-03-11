"use client";

import { useState } from "react";
import { CheckoutForm, type CheckoutSummary } from "@/components/checkout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CheckoutPage() {
  const [summary, setSummary] = useState<CheckoutSummary>({
    subtotal: 0,
    discountAmount: 0,
    shippingCost: 0,
    amount: 0,
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="text-4xl">Checkout</h1>
      <p className="mt-2 text-muted-foreground">Detayli teslimat formu ve Stripe guvenli odeme paneli.</p>
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Shipping details</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckoutForm onSummaryChange={setSummary} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stripe Secure Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Odeme Stripe altyapisi ile sifreli baglanti uzerinden islenir. Kart bilgisi sunucunda tutulmaz.
              </p>
              <div id="checkout-payment-slot" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Order summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Ara toplam</span>
                <span>£{summary.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>İndirim</span>
                <span>-£{summary.discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Kargo</span>
                <span>£{summary.shippingCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base">
                <span>Total</span>
                <span>£{summary.amount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
