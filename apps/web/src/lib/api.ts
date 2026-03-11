import { refreshAccessToken } from "./token-refresh";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getClientAccessToken() {
  if (typeof window === "undefined") return undefined;
  const token = window.localStorage.getItem("orvexa_access_token");
  return token ?? undefined;
}

export async function apiGet<T>(path: string): Promise<T> {
  let response = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    credentials: "include",
  });
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_URL}${path}`, {
        cache: "no-store",
        credentials: "include",
        headers: { Authorization: `Bearer ${refreshed}` },
      });
    }
  }

  if (!response.ok) {
    throw new Error(`API hatası: ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const authToken = token ?? getClientAccessToken();
  let response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${refreshed}`,
        },
        body: JSON.stringify(body),
        credentials: "include",
      });
    }
  }

  if (!response.ok) {
    let message = `API hatası: ${response.status}`;
    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) message = errorBody.message;
    } catch {
      // non-json error response
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}
