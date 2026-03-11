"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { adminRequest } from "@/lib/admin-api";
import { clearMediaLibrary, readMediaLibrary, removeMediaFromLibrary, uploadImageWithProvider } from "@/lib/media-upload";

type ProviderInfo = {
  provider: "cloudinary" | "s3";
  cloudName?: string;
  folder?: string;
};

export default function AdminMediaPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<string[]>(() => readMediaLibrary());
  const [selected, setSelected] = useState<string[]>([]);

  const provider = useQuery({
    queryKey: ["admin-media-provider"],
    queryFn: () => adminRequest<ProviderInfo>("/api/admin/media/provider"),
  });

  const handleMultiUpload = async (files?: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      setLoading(true);
      const uploadedUrls = await Promise.all(Array.from(files).map((file) => uploadImageWithProvider(file)));
      setHistory(readMediaLibrary());
      setUrl(uploadedUrls[0] ?? "");
      toast.success(`${files.length} görsel yüklendi.`);
    } catch {
      toast.error("Toplu upload başarısız.");
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = useMemo(
    () => history.filter((item) => item.toLowerCase().includes(query.toLowerCase())),
    [history, query],
  );

  const allFilteredSelected = filteredHistory.length > 0 && filteredHistory.every((item) => selected.includes(item));

  const toggleSelected = (urlToToggle: string) => {
    setSelected((prev) => (prev.includes(urlToToggle) ? prev.filter((item) => item !== urlToToggle) : [...prev, urlToToggle]));
  };

  const deleteSelected = () => {
    if (selected.length === 0) return;
    selected.forEach((item) => removeMediaFromLibrary(item));
    setHistory(readMediaLibrary());
    setSelected([]);
    toast.success(`${selected.length} görsel kaldırıldı.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Media Upload</h1>
          <p className="text-sm text-muted-foreground">Ürünlerde kullanacağınız görselleri tek yerden yönetin.</p>
        </div>
        <Badge variant="secondary">Provider: {provider.data?.provider ?? "unknown"}</Badge>
      </div>

      <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Yeni Yükleme</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded border p-3 text-sm">
              {provider.data?.provider === "cloudinary" ? (
                <p className="text-muted-foreground">
                  Cloudinary: {provider.data.cloudName || "-"} / {provider.data.folder || "-"}
                </p>
              ) : (
                <p className="text-muted-foreground">S3 presigned upload aktif.</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Görsel yükle (tekli / çoklu)</p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  void handleMultiUpload(e.target.files);
                }}
                disabled={loading}
              />
            </div>

            {url ? (
              <div className="space-y-2 rounded border p-3 text-sm">
                <p className="text-muted-foreground">Son yüklenen</p>
                <div className="relative aspect-video overflow-hidden rounded border">
                  <Image src={url} alt="Son yüklenen görsel" fill className="object-cover" />
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medya Kütüphanesi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="URL ara..."
                className="max-w-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Badge variant="outline">
                {filteredHistory.length} görsel
              </Badge>
              <Button type="button" variant="outline" onClick={() => setHistory(readMediaLibrary())}>
                Yenile
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setQuery("");
                }}
                disabled={!query}
              >
                Filtreyi Temizle
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelected(allFilteredSelected ? [] : filteredHistory);
                }}
                disabled={filteredHistory.length === 0}
              >
                {allFilteredSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (selected.length === 0) return;
                  await navigator.clipboard.writeText(selected.join("\n"));
                  toast.success(`${selected.length} link kopyalandı.`);
                }}
                disabled={selected.length === 0}
              >
                Seçiliyi Kopyala
              </Button>
              <Button type="button" variant="destructive" onClick={deleteSelected} disabled={selected.length === 0}>
                Seçiliyi Sil ({selected.length})
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearMediaLibrary();
                  setHistory([]);
                  setSelected([]);
                  toast.success("Kütüphane temizlendi.");
                }}
                disabled={history.length === 0}
              >
                Kütüphaneyi Temizle
              </Button>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Eşleşen görsel bulunamadı.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredHistory.map((item) => (
                  <div key={item} className="space-y-2 rounded border p-2">
                    <button
                      type="button"
                      className="relative block aspect-video w-full overflow-hidden rounded border"
                      onClick={() => toggleSelected(item)}
                    >
                      <Image src={item} alt="Media preview" fill className="object-cover" />
                      {selected.includes(item) ? (
                        <span className="absolute right-2 top-2 rounded-full bg-primary p-1 text-primary-foreground">
                          <Check className="size-3" />
                        </span>
                      ) : null}
                    </button>
                    <p className="truncate text-xs text-muted-foreground">{item}</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await navigator.clipboard.writeText(item);
                          toast.success("Link kopyalandı.");
                        }}
                      >
                        Kopyala
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => window.open(item, "_blank")}>
                        Aç
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          removeMediaFromLibrary(item);
                          setHistory(readMediaLibrary());
                          toast.success("Görsel kütüphaneden kaldırıldı.");
                        }}
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
