"use client";

import Image from "next/image";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { adminRequest } from "@/lib/admin-api";
import { readMediaLibrary, uploadImageWithProvider } from "@/lib/media-upload";

type ProductPayload = {
  title: string;
  slug: string;
  description: string;
  category: string;
  heroImage: string;
  gallery: string[];
  infoItemsText: string;
  productStory: string;
  dimensionsText: string;
  deliveryInfoText: string;
  makerStory: string;
  featured: boolean;
  price: number;
  stock: number;
};

export function ProductForm({
  initial,
  mode,
  productId,
}: {
  initial?: ProductPayload;
  mode: "create" | "edit";
  productId?: string;
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [libraryUrls, setLibraryUrls] = useState<string[]>(() => readMediaLibrary());
  const categoriesQuery = useQuery({
    queryKey: ["admin-product-form-categories"],
    queryFn: () =>
      adminRequest<{ rows: Array<{ _id: string; name: string }> }>("/api/admin/categories?limit=100&sortBy=name&sortDir=asc"),
  });
  const [state, setState] = useState<ProductPayload>(
    initial ?? {
      title: "",
      slug: "",
      description: "",
      category: "",
      heroImage: "",
      gallery: [],
      infoItemsText: "",
      productStory: "",
      dimensionsText: "",
      deliveryInfoText: "",
      makerStory: "",
      featured: false,
      price: 55,
      stock: 20,
    },
  );

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        slug: state.slug || state.title.toLowerCase().replaceAll(" ", "-"),
        title: state.title,
        description: state.description,
        category: state.category,
        heroImage:
          state.heroImage ||
          "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80",
        gallery: state.gallery.length ? state.gallery : state.heroImage ? [state.heroImage] : [],
        specs: state.infoItemsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        productStory: state.productStory.trim(),
        dimensions: state.dimensionsText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        deliveryInfo: state.deliveryInfoText
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        makerStory: state.makerStory.trim(),
        featured: state.featured,
        stock: Number(state.stock),
        variants: [{ sku: `${Date.now()}`, title: "Default", price: Number(state.price), stock: Number(state.stock) }],
      };
      if (mode === "create") {
        return adminRequest("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      return adminRequest(`/api/admin/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      toast.success(mode === "create" ? "Ürün oluşturuldu." : "Ürün güncellendi.");
      router.push("/admin/products");
      router.refresh();
    },
    onError: (error) => toast.error(error.message || "Kaydetme işlemi başarısız."),
  });

  const onUploadGalleryFiles = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setUploading(true);
      const uploaded = await Promise.all(Array.from(files).map((file) => uploadImageWithProvider(file)));
      setState((p) => {
        const merged = Array.from(new Set([...p.gallery, ...uploaded]));
        return { ...p, heroImage: p.heroImage || uploaded[0] || "", gallery: merged };
      });
      setLibraryUrls(readMediaLibrary());
      toast.success(`${uploaded.length} görsel galeriye eklendi.`);
    } catch {
      toast.error("Galeri yüklemesi başarısız.");
    } finally {
      setUploading(false);
    }
  };

  const toggleGalleryImage = (url: string) => {
    setState((p) => {
      if (p.gallery.includes(url)) {
        return { ...p, gallery: p.gallery.filter((img) => img !== url) };
      }
      return { ...p, gallery: [...p.gallery, url] };
    });
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
        <Label>Açıklama</Label>
        <Textarea
          rows={6}
          value={state.description}
          onChange={(e) => setState((p) => ({ ...p, description: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">En az 2 karakter giriniz.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Kategori</Label>
          <select
            className="w-full rounded border bg-background p-2 text-sm"
            value={state.category}
            onChange={(e) => setState((p) => ({ ...p, category: e.target.value }))}
          >
            <option value="">Kategori seçin</option>
            {(categoriesQuery.data?.rows ?? []).map((category) => (
              <option key={category._id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 text-sm text-muted-foreground">
          <Label>Hero görsel</Label>
          <p>{state.heroImage ? "Aşağıdaki medya kütüphanesinden seçiliyor." : "Henüz seçilmedi."}</p>
        </div>
      </div>

      <div className="space-y-1">
        <Label>THE PRODUCT metni</Label>
        <Textarea
          rows={4}
          value={state.productStory}
          onChange={(e) => setState((p) => ({ ...p, productStory: e.target.value }))}
          placeholder="Ürünün hikayesi ve öne çıkan açıklama metni"
        />
      </div>

      <div className="space-y-1">
        <Label>INFORMATION satırları (her satır bir madde)</Label>
        <Textarea
          rows={4}
          value={state.infoItemsText}
          onChange={(e) => setState((p) => ({ ...p, infoItemsText: e.target.value }))}
          placeholder="3D lazer panel&#10;USB-C guc&#10;Dokunmatik kontrol"
        />
      </div>

      <div className="space-y-1">
        <Label>DIMENSIONS satırları (her satır bir ölçü)</Label>
        <Textarea
          rows={3}
          value={state.dimensionsText}
          onChange={(e) => setState((p) => ({ ...p, dimensionsText: e.target.value }))}
          placeholder="Large: H34cm x W30cm&#10;Medium: H26cm x W23cm"
        />
      </div>

      <div className="space-y-1">
        <Label>DELIVERY satırları (her satır bir teslimat bilgisi)</Label>
        <Textarea
          rows={3}
          value={state.deliveryInfoText}
          onChange={(e) => setState((p) => ({ ...p, deliveryInfoText: e.target.value }))}
          placeholder="Stokta: 2-3 iş günü&#10;Pre-order: 3-4 hafta"
        />
      </div>

      <div className="space-y-1">
        <Label>THE MAKER metni</Label>
        <Textarea
          rows={4}
          value={state.makerStory}
          onChange={(e) => setState((p) => ({ ...p, makerStory: e.target.value }))}
          placeholder="Üretici marka hikayesi"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1">
          <Label>Fiyat (GBP)</Label>
          <Input
            type="number"
            value={state.price}
            onChange={(e) => setState((p) => ({ ...p, price: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Stok</Label>
          <Input
            type="number"
            value={state.stock}
            onChange={(e) => setState((p) => ({ ...p, stock: Number(e.target.value) }))}
          />
        </div>
        <div className="space-y-1">
          <Label>Öne çıkar</Label>
          <select
            className="w-full rounded border bg-background p-2 text-sm"
            value={state.featured ? "1" : "0"}
            onChange={(e) => setState((p) => ({ ...p, featured: e.target.value === "1" }))}
          >
            <option value="0">Hayır</option>
            <option value="1">Evet</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Medya yükle (Cloudinary/S3)</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            void onUploadGalleryFiles(e.target.files);
          }}
          disabled={uploading}
        />
      </div>

      <div className="space-y-2 rounded border p-3">
        <div className="flex items-center justify-between">
          <Label>Medya kütüphanesi (cloud yüklemeler)</Label>
          <Button type="button" size="sm" variant="outline" onClick={() => setLibraryUrls(readMediaLibrary())}>
            Yenile
          </Button>
        </div>
        {libraryUrls.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz yüklenmiş görsel yok.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {libraryUrls.slice(0, 20).map((url) => (
              <div key={url} className="space-y-2 rounded border p-2">
                <div className="relative aspect-video overflow-hidden rounded border">
                  <Image src={url} alt="Media library item" fill className="object-cover" />
                </div>
                <p className="truncate text-xs text-muted-foreground">{url}</p>
                <Button
                  type="button"
                  size="sm"
                  variant={state.heroImage === url ? "default" : "outline"}
                  onClick={() => {
                    setState((p) => ({ ...p, heroImage: url }));
                    toast.success("Hero görsel seçildi.");
                  }}
                >
                  Hero seç
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={state.gallery.includes(url) ? "default" : "outline"}
                  onClick={() => toggleGalleryImage(url)}
                >
                  {state.gallery.includes(url) ? "Galeriden çıkar" : "Galeriye ekle"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => router.push("/admin/products")}>
          Vazgeç
        </Button>
        <Button
          onClick={() => mutation.mutate()}
          disabled={
            mutation.isPending ||
            state.title.trim().length < 2 ||
            state.description.trim().length < 2 ||
            !state.category ||
            !state.heroImage
          }
        >
          {mode === "create" ? "Ürün Oluştur" : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </div>
  );
}
