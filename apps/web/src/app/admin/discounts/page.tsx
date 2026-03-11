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

type Discount = {
  _id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  isActive: boolean;
  usageLimit?: number;
  usageCount: number;
  startsAt?: string;
  endsAt?: string;
};

export default function AdminDiscountsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const discountsQuery = useQuery({
    queryKey: ["admin-discounts-page", q, sortBy, sortDir, page],
    queryFn: () =>
      adminRequest<{ rows: Discount[]; page: number; totalPages: number }>(
        `/api/admin/discounts?q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}&page=${page}&limit=10`,
      ),
  });

  const rows = useMemo(() => discountsQuery.data?.rows ?? [], [discountsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminRequest(`/api/admin/discounts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-discounts-page"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success("İndirim kodu silindi.");
    },
    onError: () => toast.error("İndirim kodu silinemedi."),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Discounts</h1>
        <Link href="/admin/discounts/new" className={buttonVariants()}>
          Yeni Kod
        </Link>
      </div>

      <div className="flex gap-3">
        <Input
          className="max-w-md"
          placeholder="Kod ara..."
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
                label="Code"
                field="code"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(field, dir) => {
                  setSortBy(field);
                  setSortDir(dir);
                }}
              />
              <SortableTh
                label="Type"
                field="type"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(field, dir) => {
                  setSortBy(field);
                  setSortDir(dir);
                }}
              />
              <SortableTh
                label="Value"
                field="value"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(field, dir) => {
                  setSortBy(field);
                  setSortDir(dir);
                }}
              />
              <SortableTh
                label="Kullanım"
                field="usageCount"
                sortBy={sortBy}
                sortDir={sortDir}
                onSortChange={(field, dir) => {
                  setSortBy(field);
                  setSortDir(dir);
                }}
              />
              <SortableTh
                label="Geçerlilik"
                field="startsAt"
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
                <td className="px-3 py-2">{row.code}</td>
                <td className="px-3 py-2">{row.type}</td>
                <td className="px-3 py-2">{row.value}</td>
                <td className="px-3 py-2">
                  {row.usageCount}/{row.usageLimit ?? "Sınırsız"}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {row.startsAt ? new Date(row.startsAt).toLocaleDateString("tr-TR") : "-"} /{" "}
                  {row.endsAt ? new Date(row.endsAt).toLocaleDateString("tr-TR") : "-"}
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Link href={`/admin/discounts/${row._id}/edit`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                      Güncelle
                    </Link>
                    <DeleteDialog label="Kayıt" onConfirm={() => deleteMutation.mutate(row._id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={discountsQuery.data?.page ?? 1}
        totalPages={discountsQuery.data?.totalPages ?? 1}
        onPageChange={(next) => setPage(next)}
      />
    </div>
  );
}
