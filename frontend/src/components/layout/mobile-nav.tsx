"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Factory, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore, useAuthStore } from "@/lib/stores";
import { hasModuleAccess, ModuleType } from "@/lib/permissions";

const items: { href: string; icon: any; label: string; module: ModuleType }[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Home", module: "dashboard" },
  { href: "/inventory", icon: Package, label: "Stock", module: "inventory" },
  { href: "/sales", icon: ShoppingCart, label: "Sales", module: "sales" },
  { href: "/manufacturing", icon: Factory, label: "Mfg", module: "manufacturing" },
];

export function MobileNav() {
  const pathname = usePathname();
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="flex justify-around py-1.5">
        {items.filter(item => hasModuleAccess(user?.role, item.module)).map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]",
                active ? "text-[var(--primary)] font-semibold" : "text-[var(--muted)]"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <button onClick={toggleSidebar} className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] text-[var(--muted)]">
          <Menu className="h-5 w-5" />
          More
        </button>
      </div>
    </nav>
  );
}
