"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { adminRequest } from "@/lib/admin-api";
import { clearSession } from "@/lib/session";

interface MeResponse {
  id: string;
  email: string;
  roles: string[];
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const meQuery = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => adminRequest<MeResponse>("/api/auth/me"),
    enabled: true,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.isError) {
      clearSession();
      router.replace(`/account?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (meQuery.data && !meQuery.data.roles.includes("admin")) {
      router.replace("/");
    }
  }, [meQuery.data, meQuery.isError, pathname, router]);

  if (meQuery.isLoading) {
    return <div className="mx-auto max-w-7xl px-6 py-10 text-sm text-muted-foreground">Admin doğrulanıyor...</div>;
  }

  if (!meQuery.data?.roles.includes("admin")) {
    return null;
  }

  return <>{children}</>;
}
