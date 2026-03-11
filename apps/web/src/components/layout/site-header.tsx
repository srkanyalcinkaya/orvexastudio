"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { clearSession, getAccessToken, getUserFromSession } from "@/lib/session";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/shop", label: "3D Lamps" },
  { href: "/shop?category=Desk", label: "Desk Lamps" },
  { href: "/shop?category=Ambient", label: "Ambient" },
  { href: "/shop?category=Smart", label: "Smart Lighting" },
];

export function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = getAccessToken();
    const user = getUserFromSession<{ email: string; roles?: string[] }>();
    setIsLoggedIn(Boolean(token && user));
    setIsAdmin(Boolean(user?.roles?.includes("admin")));
  }, []);

  const onLogout = () => {
    clearSession();
    setIsLoggedIn(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="text-xl tracking-[0.28em]">
          ORVEXA
        </Link>
        <nav className="hidden gap-8 text-sm md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted-foreground transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {isAdmin ? (
                <Link href="/admin" className={buttonVariants({ variant: "ghost" })}>
                  Admin Panel
                </Link>
              ) : null}
              <Link href="/account" className={buttonVariants({ variant: "ghost" })}>
                Hesabim
              </Link>
              <button type="button" className={buttonVariants({ variant: "ghost" })} onClick={onLogout}>
                Cikis
              </button>
            </>
          ) : (
            <Link href="/account" className={buttonVariants({ variant: "ghost" })}>
              Sign In
            </Link>
          )}
          <Link href="/cart" className={cn(buttonVariants(), "px-4")}>
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}
