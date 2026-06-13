"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useUIStore } from "@/lib/stores";
import { useMounted } from "@/hooks/use-mounted";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { MobileNav } from "./mobile-nav";
import { NotificationPanel } from "./notification-panel";
import { CommandPalette } from "../command-palette";
import { AICopilot } from "../ai/copilot";

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const mounted = useMounted();
  const collapsed = mounted ? sidebarCollapsed : false;
  const sidebarWidth = collapsed ? 64 : 240;

  useEffect(() => {
    if (!mounted) return;
    const token = localStorage.getItem("syncra_token");
    if (!token) {
      logout();
      router.replace("/login");
    }
  }, [logout, router, mounted]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar />
      <div
        className="min-h-screen transition-[margin] duration-200 max-md:!ml-0 max-md:pb-16"
        style={{ marginLeft: mounted ? sidebarWidth : 0 }}
      >
        <Navbar />
        <main className="p-4 md:p-5 max-w-[1400px]">{children}</main>
      </div>
      <MobileNav />
      <CommandPalette />
      <AICopilot />
      <NotificationPanel />
    </div>
  );
}
