"use client";

import { useUIStore } from "@/lib/stores";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, systemApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { X } from "lucide-react";

export function NotificationPanel() {
  const { notificationPanelOpen, setNotificationPanelOpen } = useUIStore();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => systemApi.notifications().then((r) => r.data.data).catch(() => [
      { id: "1", type: "LOW_STOCK", title: "Low stock", message: "Office Chair below reorder point", isRead: false, link: "/inventory", createdAt: "2026-06-13T10:00:00.000Z" },
      { id: "2", type: "AI_INSIGHT", title: "Procurement tip", message: "Order teak wood before Monday", isRead: false, link: "/procurement", createdAt: "2026-06-13T09:00:00.000Z" },
    ]),
    enabled: notificationPanelOpen,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/system/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!notificationPanelOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setNotificationPanelOpen(false)} />
      <div className="fixed right-0 top-0 z-50 h-screen w-full max-w-sm bg-[var(--surface)] border-l border-[var(--border)] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <p className="text-sm font-bold">Alerts & Notifications</p>
          <button onClick={() => setNotificationPanelOpen(false)}><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {(notifications || []).map((n: { id: string; title: string; message: string; isRead: boolean; link?: string; createdAt: string }) => (
            <Link
              key={n.id}
              href={n.link || "#"}
              onClick={() => { if (!n.isRead) markRead.mutate(n.id); setNotificationPanelOpen(false); }}
              className={`block p-3 rounded border text-sm ${
                n.isRead ? "border-transparent" : "border-[var(--primary)]/30 bg-[var(--background)]"
              }`}
            >
              <p className="font-semibold text-[13px]">{n.title}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{n.message}</p>
              <p className="text-[10px] text-[var(--muted)] mt-1">{formatDate(n.createdAt)}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
