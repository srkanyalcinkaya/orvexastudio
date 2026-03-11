"use client";

import { adminRequest } from "./admin-api";

type ProviderInfo = {
  provider: "cloudinary" | "s3";
  cloudName?: string;
  folder?: string;
};

const MEDIA_LIBRARY_KEY = "orvexa_media_library_urls";

export function readMediaLibrary(): string[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(MEDIA_LIBRARY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((url): url is string => typeof url === "string") : [];
  } catch {
    return [];
  }
}

export function saveMediaToLibrary(url: string) {
  if (typeof window === "undefined" || !url) return;
  const deduped = [url, ...readMediaLibrary().filter((item) => item !== url)].slice(0, 50);
  window.localStorage.setItem(MEDIA_LIBRARY_KEY, JSON.stringify(deduped));
}

export function removeMediaFromLibrary(url: string) {
  if (typeof window === "undefined") return;
  const next = readMediaLibrary().filter((item) => item !== url);
  window.localStorage.setItem(MEDIA_LIBRARY_KEY, JSON.stringify(next));
}

export function clearMediaLibrary() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MEDIA_LIBRARY_KEY);
}

export async function uploadImageWithProvider(file: File): Promise<string> {
  const provider = await adminRequest<ProviderInfo>("/api/admin/media/provider");

  if (provider.provider === "cloudinary") {
    const sign = await adminRequest<{
      uploadUrl: string;
      fields: Record<string, string | number>;
    }>("/api/admin/media/cloudinary-sign", {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, contentType: file.type }),
    });

    const formData = new FormData();
    Object.entries(sign.fields).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    formData.append("file", file);

    const uploadResp = await fetch(sign.uploadUrl, {
      method: "POST",
      body: formData,
    });
    if (!uploadResp.ok) throw new Error("Cloudinary upload başarısız.");
    const json = (await uploadResp.json()) as { secure_url: string };
    saveMediaToLibrary(json.secure_url);
    return json.secure_url;
  }

  const signed = await adminRequest<{ uploadUrl: string; publicUrl: string }>("/api/admin/media/s3-presign", {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  });

  const putResp = await fetch(signed.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });
  if (!putResp.ok) throw new Error("S3 upload başarısız.");
  saveMediaToLibrary(signed.publicUrl);
  return signed.publicUrl;
}
