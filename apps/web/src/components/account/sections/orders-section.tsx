"use client";

import { useQuery } from "@tanstack/react-query";
import { accountRequest } from "@/lib/account-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Order = {
  _id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  shippingStatus: string;
  createdAt: string;
};

export function OrdersSection() {
  const orders = useQuery({
    queryKey: ["account-orders"],
    queryFn: () => accountRequest<Order[]>("/api/orders"),
  });

  if (orders.isLoading) return <p className="text-sm text-muted-foreground">Siparişler yükleniyor...</p>;

  return (
    <div className="space-y-3">
      {orders.data?.length ? (
        orders.data.map((order) => (
          <Card key={order._id}>
            <CardHeader>
              <CardTitle className="text-base">{order.orderNumber}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
              <p>Toplam: £{order.total.toFixed(2)}</p>
              <p>Ödeme: {order.paymentStatus}</p>
              <p>Kargo: {order.shippingStatus}</p>
              <p>Tarih: {new Date(order.createdAt).toLocaleDateString("tr-TR")}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">Henüz siparişiniz yok.</CardContent>
        </Card>
      )}
    </div>
  );
}
