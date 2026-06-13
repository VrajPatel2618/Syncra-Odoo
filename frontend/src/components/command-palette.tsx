"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { useUIStore } from "@/lib/stores";
import { allNavItems } from "@/lib/navigation";
import * as Icons from "lucide-react";

const iconMap = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/40" onClick={() => setCommandPaletteOpen(false)} />
      <div className="fixed left-1/2 top-[15%] z-50 w-full max-w-lg -translate-x-1/2 panel shadow-lg overflow-hidden">
        <Command>
          <Command.Input
            placeholder="Jump to page…"
            className="w-full px-4 py-3 text-sm border-b border-[var(--border)] bg-[var(--surface)] outline-none"
          />
          <Command.List className="max-h-72 overflow-y-auto p-2">
            <Command.Empty className="py-4 text-center text-sm text-[var(--muted)]">Nothing found.</Command.Empty>
            {allNavItems.map((item) => {
              const Icon = iconMap[item.icon] || Icons.Circle;
              return (
                <Command.Item
                  key={item.href}
                  value={item.title}
                  onSelect={() => { router.push(item.href); setCommandPaletteOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded cursor-pointer aria-selected:bg-[var(--surface-2)]"
                >
                  <Icon className="h-4 w-4 text-[var(--muted)]" />
                  {item.title}
                </Command.Item>
              );
            })}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
