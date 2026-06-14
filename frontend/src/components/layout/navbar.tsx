"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, MessageSquare, Sun, Moon, LogOut, User, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore, useUIStore } from "@/lib/stores";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, setCommandPaletteOpen, setNotificationPanelOpen } = useUIStore();
  const [profileOpen, setProfileOpen] = useState(false);

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => systemApi.notifications().then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const unread = notifications?.filter((n: { isRead: boolean }) => !n.isRead).length || 0;

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4">
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-2 rounded border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs text-[var(--muted)] hover:border-[var(--primary)] w-full max-w-xs"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search modules…</span>
        <kbd className="ml-auto text-[10px] bg-[var(--surface-2)] px-1.5 py-0.5 rounded">Ctrl+K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>


        <Button variant="ghost" size="icon" onClick={() => setNotificationPanelOpen(true)} className="relative" title="Alerts">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full bg-[var(--danger)] text-[9px] text-white font-bold">
              {unread}
            </span>
          )}
        </Button>

        <div className="relative ml-1">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded border border-[var(--border)] px-2 py-1 hover:bg-[var(--surface-2)]"
          >
            <div className="h-6 w-6 rounded bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <span className="hidden md:block text-xs font-medium">{user?.firstName}</span>
            <ChevronDown className="h-3 w-3 text-[var(--muted)]" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 panel py-1 z-50 shadow-md">
              <button onClick={() => { router.push("/profile"); setProfileOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-2)]">
                <User className="h-3.5 w-3.5" /> My Profile
              </button>
              <button onClick={() => { router.push("/settings"); setProfileOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--surface-2)]">
                Settings
              </button>
              <hr className="my-1 border-[var(--border)]" />
              <button onClick={() => { logout(); router.push("/login"); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--danger)] hover:bg-red-50 dark:hover:bg-red-950">
                <LogOut className="h-3.5 w-3.5" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
