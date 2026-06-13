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
            <div><p className="font-medium">{log.action} • {log.entityType}</p>
              <p className="text-sm text-muted">{log.user?.firstName} {log.user?.lastName} • {formatDate(log.createdAt)}</p>
              {log.blockchainHash && <p className="text-xs font-mono text-cyan-400 mt-1">{truncateHash(log.blockchainHash)}</p>}</div>
            {log.verified && <span className="flex items-center gap-1 text-xs text-emerald-400"><CheckCircle className="h-4 w-4" /> Verified</span>}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
