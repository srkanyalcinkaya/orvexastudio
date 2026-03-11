"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BlogForm } from "@/components/admin/blog-form";
import { adminRequest } from "@/lib/admin-api";

export default function AdminEditBlogPage() {
  const params = useParams<{ id: string }>();
  const blogId = params.id;

  const state = useQuery({
    queryKey: ["admin-blog-edit", blogId],
    queryFn: () =>
      adminRequest<{
        _id: string;
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        coverImage?: string;
        tags?: string[];
        published: boolean;
      }>(`/api/admin/blogs/${blogId}`),
    enabled: Boolean(blogId),
  });

  if (state.isLoading) return <div className="text-sm text-muted-foreground">Yükleniyor...</div>;
  if (!state.data) return <div className="text-sm text-destructive">Blog bulunamadı.</div>;

  return (
    <div className="space-y-5">
      <h1 className="text-3xl">Blog Düzenle</h1>
      <BlogForm
        mode="edit"
        blogId={state.data._id}
        initial={{
          title: state.data.title,
          slug: state.data.slug,
          excerpt: state.data.excerpt,
          content: state.data.content,
          coverImage: state.data.coverImage ?? "",
          tags: (state.data.tags ?? []).join(", "),
          published: state.data.published,
        }}
      />
    </div>
  );
}
