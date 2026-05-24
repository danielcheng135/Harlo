"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/mock-data";

export function SidebarNav({ role, variant = "sidebar" }: { role: string; variant?: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !("adminOnly" in item && item.adminOnly) || role === "owner" || role === "admin");

  return (
    <nav className={variant === "mobile" ? "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "mt-8 space-y-1"}>
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href as Route}
            className={
              variant === "mobile"
                ? `inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition ${
                  isActive
                    ? "border-harlo-teal bg-harlo-mist text-harlo-teal"
                    : "border-harlo-line bg-white text-harlo-muted hover:border-harlo-teal/50 hover:text-harlo-ink"
                }`
                : `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-harlo-mist text-harlo-teal"
                    : "text-harlo-muted hover:bg-harlo-mist hover:text-harlo-ink"
                }`
            }
          >
            <item.icon size={variant === "mobile" ? 16 : 17} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
