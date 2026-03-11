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

type Blog = { _id: string; title: string; slug: string; published: boolean };

export default function AdminBlogsPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);

  const blogsQuery = useQuery({
    queryKey: ["admin-blogs-page", q, sortBy, sortDir, page],
    queryFn: () =>
      adminRequest<{ rows: Blog[]; page: number; totalPages: number }>(
        `/api/admin/blogs?q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}&page=${page}&limit=10`,
      ),
  });

  const rows = useMemo(() => blogsQuery.data?.rows ?? [], [blogsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminRequest(`/api/admin/blogs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-blogs-page"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success("Blog silindi.");
    },
    onError: () => toast.error("Blog silinemedi."),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Blogs</h1>
        <Link href="/admin/blogs/new" className={buttonVariants()}>
          Yeni Blog
        </Link>
      </div>

      <div className="flex gap-3">
        <Input
          className="max-w-md"
          placeholder="Blog ara..."
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
                label="Published"
                field="published"
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
                <td className="px-3 py-2">{row.title}</td>
                <td className="px-3 py-2">{row.slug}</td>
                <td className="px-3 py-2">{row.published ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Link href={`/admin/blogs/${row._id}/edit`} className={buttonVariants({ size: "sm", variant: "outline" })}>
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
        page={blogsQuery.data?.page ?? 1}
        totalPages={blogsQuery.data?.totalPages ?? 1}
        onPageChange={(next) => setPage(next)}
      />
    </div>
  );
}
