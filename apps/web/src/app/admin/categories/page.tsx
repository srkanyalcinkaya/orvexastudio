"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminRequest } from "@/lib/admin-api";
import { DeleteDialog } from "@/components/admin/delete-dialog";
import { SortableTh } from "@/components/admin/sortable-th";
import { TablePagination } from "@/components/admin/table-pagination";

type Category = { _id: string; name: string; slug: string; isActive: boolean };

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories-page", q, sortBy, sortDir, page],
    queryFn: () =>
      adminRequest<{ rows: Category[]; page: number; totalPages: number }>(
        `/api/admin/categories?q=${encodeURIComponent(q)}&sortBy=${sortBy}&sortDir=${sortDir}&page=${page}&limit=10`,
      ),
  });

  const rows = useMemo(() => categoriesQuery.data?.rows ?? [], [categoriesQuery.data]);

  const createMutation = useMutation({
    mutationFn: () =>
      adminRequest("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({ name, slug: name.toLowerCase().replaceAll(" ", "-"), isActive: true }),
      }),
    onSuccess: () => {
      setName("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-categories-page"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success("Kategori eklendi.");
    },
    onError: () => toast.error("Kategori eklenemedi."),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      adminRequest(`/api/admin/categories/${selected!._id}`, {
        method: "PATCH",
        body: JSON.stringify({ name, slug: name.toLowerCase().replaceAll(" ", "-") }),
      }),
    onSuccess: () => {
      setEditOpen(false);
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin-categories-page"] });
      toast.success("Kategori güncellendi.");
    },
    onError: () => toast.error("Kategori güncellenemedi."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminRequest(`/api/admin/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories-page"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
      toast.success("Kategori silindi.");
    },
    onError: () => toast.error("Kategori silinemedi."),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Categories</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>Yeni Kategori</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kategori ekle</DialogTitle>
            </DialogHeader>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategori adı" />
            <Button onClick={() => createMutation.mutate()} disabled={!name}>
              Kaydet
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <Input
          className="max-w-md"
          placeholder="Kategori ara..."
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
                label="Name"
                field="name"
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
              <th className="px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row._id} className="border-t">
                <td className="px-3 py-2">{row.name}</td>
                <td className="px-3 py-2">{row.slug}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(row);
                        setName(row.name);
                        setEditOpen(true);
                      }}
                    >
                      Güncelle
                    </Button>
                    <DeleteDialog label="Kayıt" onConfirm={() => deleteMutation.mutate(row._id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={categoriesQuery.data?.page ?? 1}
        totalPages={categoriesQuery.data?.totalPages ?? 1}
        onPageChange={(next) => setPage(next)}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategori güncelle</DialogTitle>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kategori adı" />
          <Button onClick={() => updateMutation.mutate()} disabled={!selected}>
            Güncelle
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
