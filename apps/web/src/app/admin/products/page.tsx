"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminRequest } from "@/lib/admin-api";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { SortableTh } from "@/components/admin/sortable-th";
import { TablePagination } from "@/components/admin/table-pagination";

type Product = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  featured: boolean;
  heroImage: string;
};

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const productsQuery = useQuery({
    queryKey: ["admin-products-page", q, sortBy, sortDir, page],
    queryFn: () =>
      adminRequest<{ rows: Product[]; page: number; totalPages: number; total: number }>(
        `/api/admin/products?q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}&page=${page}&limit=10`,
      ),
  });

  const rows = useMemo(() => productsQuery.data?.rows ?? [], [productsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      adminRequest(`/api/admin/products/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Ürün silindi.");
      qc.invalidateQueries({ queryKey: ["admin-products-page"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
    onError: () => toast.error("Ürün silinemedi."),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Products</h1>
        <Link href="/admin/products/new" className={buttonVariants()}>
          Yeni Ürün
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-md"
          placeholder="Ürün ara..."
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
                label="Title"
                field="title"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(field, dir) => {
                  setSortBy(field);
                  setSortDir(dir);
                }}
              />
              <SortableTh
                label="Slug"
                field="slug"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(field, dir) => {
                  setSortBy(field);
                  setSortDir(dir);
                }}
              />
              <SortableTh
                label="Category"
                field="category"
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
            {rows.map((item) => (
              <tr key={item._id} className="border-t">
                <td className="px-3 py-2">{item.title}</td>
                <td className="px-3 py-2">{item.slug}</td>
                <td className="px-3 py-2">{item.category}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Link href={`/admin/products/${item._id}/edit`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                      Güncelle
                    </Link>
                    <DeleteDialog label="Ürün" onConfirm={() => deleteMutation.mutate(item._id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={productsQuery.data?.page ?? 1}
        totalPages={productsQuery.data?.totalPages ?? 1}
        onPageChange={(next) => setPage(next)}
      />
    </div>
  );
}
