"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminRequest } from "@/lib/admin-api";

export default function AdminPage() {
  const overview = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () =>
      adminRequest<{
        products: number;
        categories: number;
        blogs: number;
        discounts: number;
        orders: number;
      }>("/api/admin/overview"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-4xl">Admin Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Yönetim alanları ayrı sayfalara ayrıldı: tablo, arama/sıralama ve modal CRUD her bölümde mevcut.
      </p>
      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard title="Products" value={overview.data?.products ?? 0} />
        <MetricCard title="Categories" value={overview.data?.categories ?? 0} />
        <MetricCard title="Blogs" value={overview.data?.blogs ?? 0} />
        <MetricCard title="Discounts" value={overview.data?.discounts ?? 0} />
        <MetricCard title="Orders" value={overview.data?.orders ?? 0} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <QuickLink href="/admin/products" title="Products">
          Ürünleri yönet, arama/sıralama yap, modal ile ekle-güncelle-sil.
        </QuickLink>
        <QuickLink href="/admin/categories" title="Categories">
          Kategori operasyonlarını ayrı ekranda yönet.
        </QuickLink>
        <QuickLink href="/admin/blogs" title="Blogs">
          Blog içeriklerini yayınla, düzenle ve sil.
        </QuickLink>
        <QuickLink href="/admin/discounts" title="Discounts">
          İndirim kodlarını merkezi olarak yönet.
        </QuickLink>
        <QuickLink href="/admin/orders" title="Orders">
          Sipariş durumlarını tablo üzerinden güncelle.
        </QuickLink>
        <QuickLink href="/admin/media" title="Media Upload">
          Cloudinary/S3 upload akışını yönet.
        </QuickLink>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function QuickLink({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="rounded-sm border bg-card p-5 transition hover:border-foreground/40">
      <h3 className="text-xl">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{children}</p>
    </Link>
  );
}
