"use client";

import { getAccessToken } from "./session";
import { refreshAccessToken } from "./token-refresh";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function adminRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  let response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_URL}${path}`, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshed}`,
          ...(init.headers ?? {}),
        },
        cache: "no-store",
      });
    }
  }

  if (!response.ok) {
    let message = `Admin API hata: ${response.status}`;
    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) message = errorBody.message;
    } catch {
      // noop
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export function sortBy<T>(rows: T[], key: keyof T, dir: "asc" | "desc") {
  return [...rows].sort((a, b) => {
    const av = String(a[key] ?? "");
    const bv = String(b[key] ?? "");
    const cmp = av.localeCompare(bv, "tr");
    return dir === "asc" ? cmp : -cmp;
  });
}
