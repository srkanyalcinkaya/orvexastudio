"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminRequest } from "@/lib/admin-api";
import { SortableTh } from "@/components/admin/sortable-th";
import { TablePagination } from "@/components/admin/table-pagination";

type Order = {
  _id: string;
  orderNumber: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  shippingStatus: "pending" | "label_created" | "in_transit" | "delivered";
};

export default function AdminOrdersPage() {
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const ordersQuery = useQuery({
    queryKey: ["admin-orders-page", q, sortBy, sortDir, page],
    queryFn: () =>
      adminRequest<{ rows: Order[]; page: number; totalPages: number }>(
        `/api/admin/orders?q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}&page=${page}&limit=10`,
      ),
  });

  const rows = useMemo(() => ordersQuery.data?.rows ?? [], [ordersQuery.data]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Orders</h1>
      </div>

      <div className="flex gap-3">
        <Input
          className="max-w-md"
          placeholder="Order no ara..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="overflow-x-auto rounded-sm border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <SortableTh
                label="Order"
                field="orderNumber"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(field, dir) => {
                  setSortBy(field);
                  setSortDir(dir);
                }}
              />
              <SortableTh
                label="Payment"
                field="paymentStatus"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(field, dir) => {
                  setSortBy(field);
                  setSortDir(dir);
                }}
              />
              <SortableTh
                label="Shipping"
                field="shippingStatus"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(field, dir) => {
                  setSortBy(field);
                  setSortDir(dir);
                }}
              />
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-t">
                <td className="px-3 py-2">{row.orderNumber}</td>
                <td className="px-3 py-2">{row.paymentStatus}</td>
                <td className="px-3 py-2">{row.shippingStatus}</td>
                <td className="px-3 py-2">
                  <Link href={`/admin/orders/${row._id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={ordersQuery.data?.page ?? 1}
        totalPages={ordersQuery.data?.totalPages ?? 1}
        onPageChange={(next) => setPage(next)}
      />
    </div>
  );
}
