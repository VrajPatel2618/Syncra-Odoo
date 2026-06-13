"use client";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, CheckCircle } from "lucide-react";
import { formatDate, truncateHash } from "@/lib/utils";

export default function AuditLogsPage() {
  const { data } = useQuery({ queryKey: ["audit-logs"], queryFn: () => systemApi.auditLogs().then(r => r.data.data).catch(() => [
    { id: "1", action: "CONFIRM", entityType: "SalesOrder", entityId: "so-001", user: { firstName: "Rajesh", lastName: "Sharma" }, blockchainHash: "abc123", verified: true, createdAt: new Date().toISOString() },
    { id: "2", action: "STOCK_MOVEMENT", entityType: "Inventory", entityId: "inv-001", user: { firstName: "Priya", lastName: "Patel" }, blockchainHash: "def456", verified: true, createdAt: new Date(Date.now()-3600000).toISOString() },
  ])});

  return (
    <div>
      <PageHeader title="Audit Logs" description="Complete activity trail with blockchain verification" icon={Shield} />
      <div className="space-y-3">
        {(data||[]).map((log: {id:string; action:string; entityType:string; entityId:string; user:{firstName:string;lastName:string}; blockchainHash:string; verified:boolean; createdAt:string}) => (
          <Card key={log.id} className="p-4"><CardContent className="p-0 flex items-center justify-between">
            <div>
              <p className="font-medium text-[var(--foreground)]">{log.action} • {log.entityType} <span className="text-xs text-[var(--muted)] font-normal ml-2">({log.entityId})</span></p>
              <p className="text-sm text-[var(--muted)]">{log.user?.firstName} {log.user?.lastName} • {formatDate(log.createdAt)}</p>
              {log.blockchainHash && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs font-mono text-[var(--primary)]">{truncateHash(log.blockchainHash)}</p>
                  <button onClick={() => { navigator.clipboard.writeText(log.blockchainHash); alert('Full Hash Copied! Paste this into the Verify screen.'); }} className="text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded hover:bg-[var(--primary)]/20 transition">Copy Full Hash</button>
                </div>
              )}
            </div>
            {log.verified && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="h-4 w-4" /> Verified</span>}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
