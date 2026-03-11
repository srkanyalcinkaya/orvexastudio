"use client";

import { BlogForm } from "@/components/admin/blog-form";

export default function AdminNewBlogPage() {
  return (
    <div className="space-y-5">
      <h1 className="text-3xl">Yeni Blog</h1>
      <BlogForm mode="create" />
    </div>
  );
}
