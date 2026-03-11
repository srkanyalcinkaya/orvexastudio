"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminRequest } from "@/lib/admin-api";
import { uploadImageWithProvider } from "@/lib/media-upload";
import { RichTextEditor } from "./rich-text-editor";

export type BlogPayload = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string;
  published: boolean;
};

export function BlogForm({
  mode,
  blogId,
  initial,
}: {
  mode: "create" | "edit";
  blogId?: string;
  initial?: BlogPayload;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<BlogPayload>(
    initial ?? {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      tags: "flowers,luxury",
      published: false,
    },
  );

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        title: state.title,
        slug: state.slug || state.title.toLowerCase().replaceAll(" ", "-"),
        excerpt: state.excerpt,
        content: state.content,
        coverImage: state.coverImage || undefined,
        tags: state.tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        published: state.published,
      };
      if (mode === "create") {
        return adminRequest("/api/admin/blogs", { method: "POST", body: JSON.stringify(payload) });
      }
      return adminRequest(`/api/admin/blogs/${blogId}`, { method: "PATCH", body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Blog oluşturuldu." : "Blog güncellendi.");
      router.push("/admin/blogs");
      router.refresh();
    },
    onError: () => toast.error("Kaydetme başarısız."),
  });

  const uploadCover = async (file?: File) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadImageWithProvider(file);
      setState((p) => ({ ...p, coverImage: url }));
      toast.success("Kapak görseli yüklendi.");
    } catch {
      toast.error("Kapak görseli yüklenemedi.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-sm border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Başlık</Label>
          <Input value={state.title} onChange={(e) => setState((p) => ({ ...p, title: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Slug</Label>
          <Input value={state.slug} onChange={(e) => setState((p) => ({ ...p, slug: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Özet</Label>
        <Textarea
          rows={3}
          value={state.excerpt}
          onChange={(e) => setState((p) => ({ ...p, excerpt: e.target.value }))}
        />
      </div>

      <div className="space-y-1">
        <Label>İçerik</Label>
        <RichTextEditor value={state.content} onChange={(html) => setState((p) => ({ ...p, content: html }))} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Kapak Görseli URL</Label>
          <Input value={state.coverImage} onChange={(e) => setState((p) => ({ ...p, coverImage: e.target.value }))} />
        </div>
        <div className="space-y-1">
          <Label>Tagler (virgülle)</Label>
          <Input value={state.tags} onChange={(e) => setState((p) => ({ ...p, tags: e.target.value }))} />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Kapak Görseli Upload</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            void uploadCover(e.target.files?.[0]);
          }}
          disabled={uploading}
        />
      </div>

      <div className="space-y-1">
        <Label>Yayın durumu</Label>
        <select
          className="w-full rounded border bg-background p-2 text-sm"
          value={state.published ? "1" : "0"}
          onChange={(e) => setState((p) => ({ ...p, published: e.target.value === "1" }))}
        >
          <option value="0">Taslak</option>
          <option value="1">Yayında</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push("/admin/blogs")}>
          Vazgeç
        </Button>
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !state.title || !state.content}>
          {mode === "create" ? "Blog Oluştur" : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </div>
  );
}
