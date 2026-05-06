"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/mock-data";

export function SidebarNav({ role }: { role: string }) {
  const pathname = usePathname();

  return (
    <nav className="mt-8 space-y-1">
      {navItems.filter((item) => !("adminOnly" in item && item.adminOnly) || role === "owner" || role === "admin").map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href as Route}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-harlo-mist text-harlo-teal"
                : "text-harlo-muted hover:bg-harlo-mist hover:text-harlo-ink"
            }`}
          >
            <item.icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
