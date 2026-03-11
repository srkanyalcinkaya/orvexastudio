"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { readCartItems, removeCartItem, updateCartItemQuantity, type CartItem } from "@/lib/cart-storage";

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCartItems());
  }, []);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.price * item.quantity, 0), [items]);
  const shipping = subtotal >= 90 ? 0 : 9.99;
  const total = subtotal + shipping;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-4xl">Cart</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Your items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {items.length === 0 ? <p className="text-muted-foreground">Sepetiniz boş.</p> : null}
            {items.map((item) => (
              <div key={`${item.slug}-${item.variantSku}`} className="space-y-2 border-b pb-3">
                <div className="flex items-center justify-between">
                  <p>{item.title}</p>
                  <p>£{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setItems(updateCartItemQuantity(item.slug, item.variantSku, item.quantity - 1))}
                    >
                      -
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setItems(updateCartItemQuantity(item.slug, item.variantSku, item.quantity + 1))}
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => setItems(removeCartItem(item.slug, item.variantSku))}
                  >
                    Kaldır
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>£{shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base">
              <span>Total</span>
              <span>£{total.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              className={`${buttonVariants()} mt-3 flex w-full ${items.length === 0 ? "pointer-events-none opacity-60" : ""}`}
            >
              Continue to checkout
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
