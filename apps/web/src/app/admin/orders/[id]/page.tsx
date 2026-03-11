"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminRequest } from "@/lib/admin-api";

type OrderDetail = {
  _id: string;
  orderNumber: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  shippingStatus: "pending" | "label_created" | "in_transit" | "delivered";
  subtotal: number;
  shippingCost: number;
  total: number;
  trackingNumber?: string;
  shippingAddress?: {
    fullName?: string;
    line1?: string;
    city?: string;
    postcode?: string;
    country?: string;
  };
  items?: Array<{ title?: string; quantity?: number; unitPrice?: number }>;
};

export default function AdminOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const qc = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ["admin-order-detail", orderId],
    queryFn: () => adminRequest<OrderDetail>(`/api/admin/orders/${orderId}`),
    enabled: Boolean(orderId),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Pick<OrderDetail, "paymentStatus" | "shippingStatus">>) =>
      adminRequest(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success("Sipariş güncellendi.");
      qc.invalidateQueries({ queryKey: ["admin-order-detail", orderId] });
      qc.invalidateQueries({ queryKey: ["admin-orders-page"] });
    },
    onError: () => toast.error("Güncelleme başarısız."),
  });

  if (orderQuery.isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>;
  if (!orderQuery.data) return <div className="text-sm text-destructive">Sipariş bulunamadı.</div>;

  const order = orderQuery.data;
  return (
    <div className="space-y-5">
      <h1 className="text-3xl">Sipariş Detayı - {order.orderNumber}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Durum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>Payment: {order.paymentStatus}</p>
            <p>Shipping: {order.shippingStatus}</p>
            <p>Tracking: {order.trackingNumber ?? "-"}</p>
            <div className="flex gap-2">
              <Button onClick={() => updateMutation.mutate({ paymentStatus: "paid" })}>Paid</Button>
              <Button variant="outline" onClick={() => updateMutation.mutate({ shippingStatus: "in_transit" })}>
                In Transit
              </Button>
              <Button variant="outline" onClick={() => updateMutation.mutate({ shippingStatus: "delivered" })}>
                Delivered
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tutarlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Subtotal: £{order.subtotal?.toFixed(2)}</p>
            <p>Shipping: £{order.shippingCost?.toFixed(2)}</p>
            <p className="text-base">Total: £{order.total?.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teslimat Adresi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p>{order.shippingAddress?.fullName}</p>
          <p>{order.shippingAddress?.line1}</p>
          <p>
            {order.shippingAddress?.city} {order.shippingAddress?.postcode}
          </p>
          <p>{order.shippingAddress?.country}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sipariş Kalemleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between rounded border p-2">
              <span>
                {item.title} x {item.quantity}
              </span>
              <span>£{item.unitPrice?.toFixed(2)}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
