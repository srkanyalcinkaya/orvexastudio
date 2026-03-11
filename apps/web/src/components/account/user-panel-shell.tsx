"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { AddressesSection } from "./sections/addresses-section";
import { OrdersSection } from "./sections/orders-section";
import { ProfileSection } from "./sections/profile-section";
import { ReviewsSection } from "./sections/reviews-section";
import { SecuritySection } from "./sections/security-section";

type PanelKey = "orders" | "addresses" | "profile" | "security" | "reviews";

const links: Array<{ key: PanelKey; label: string }> = [
  { key: "orders", label: "Siparişlerim" },
  { key: "addresses", label: "Adreslerim" },
  { key: "profile", label: "Profilim" },
  { key: "security", label: "Şifre Değiştir" },
  { key: "reviews", label: "Yorumlarım" },
];

export function UserPanelShell() {
  const [active, setActive] = useState<PanelKey>("orders");

  const renderContent = () => {
    if (active === "orders") return <OrdersSection />;
    if (active === "addresses") return <AddressesSection />;
    if (active === "profile") return <ProfileSection />;
    if (active === "security") return <SecuritySection />;
    return <ReviewsSection />;
  };

  return (
    <div className="mt-8 grid gap-6 md:grid-cols-[240px_1fr]">
      <aside className="h-fit rounded-sm border bg-card p-4">
        <h2 className="mb-4 text-lg">Kullanıcı Paneli</h2>
        <nav className="space-y-1 text-sm">
          {links.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActive(item.key)}
              className={cn(
                "block w-full rounded px-3 py-2 text-left text-muted-foreground transition hover:bg-muted hover:text-foreground",
                active === item.key && "bg-muted text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <section>{renderContent()}</section>
    </div>
  );
}
