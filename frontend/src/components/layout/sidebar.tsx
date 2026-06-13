"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import { navigationGroups } from "@/lib/navigation";
import { useUIStore } from "@/lib/stores";
import { useMounted } from "@/hooks/use-mounted";
import { PanelLeftClose, PanelLeft } from "lucide-react";

const iconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

export function Sidebar() {
  const pathname = usePathname();
  const persistedCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const mounted = useMounted();
  const collapsed = mounted ? persistedCollapsed : false;
  const width = collapsed ? 64 : 240;

  return (
    <aside
      style={{ width }}
      className="fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col sidebar-bg border-r border-stone-800 transition-[width] duration-200"
    >
      <div className="px-3 py-4 border-b border-stone-700">
        <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[var(--primary)] text-white text-xs font-black">
            SE
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="brand-serif text-sm font-bold text-white leading-tight">Syncra ERP</p>
              <p className="text-[10px] text-stone-400">Where Inventory Meets intelligence</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {navigationGroups.map((group) => (
          <div key={group.label} className="mb-3">
            {!collapsed && (
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = iconMap[item.icon] || Icons.Circle;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.title : undefined}
                  className={cn(
                    "flex items-center gap-2.5 mx-1.5 px-2.5 py-2 text-[13px] rounded transition-colors",
                    active
                      ? "bg-[var(--primary)] text-white font-semibold"
                      : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-stone-700 p-2">
        {!collapsed && (
          <div className="px-2 py-2 mb-1 text-[10px] text-stone-500 space-y-1">
            <p>● DB connected</p>
            <p>● Chain: Polygon testnet</p>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded py-2 text-stone-500 hover:bg-stone-800 hover:text-stone-300"
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
