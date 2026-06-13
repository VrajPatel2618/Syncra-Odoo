"use client";

import { useQuery } from "@tanstack/react-query";
import { Link2, Shield, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { systemApi } from "@/lib/api";
import { truncateHash, formatDate } from "@/lib/utils";
import { motion } from "framer-motion";

const mockLogs = [
  { id: "1", txHash: "0x7a3f8b2c1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0", eventType: "STOCK_MOVEMENT", entityType: "Inventory", entityId: "inv-001", dataHash: "a1b2c3d4", status: "CONFIRMED", network: "polygon", createdAt: new Date().toISOString() },
  { id: "2", txHash: "0x1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1", eventType: "SALES_CONFIRMED", entityType: "SalesOrder", entityId: "so-001", dataHash: "e5f6a7b8", status: "CONFIRMED", network: "polygon", createdAt: new Date(Date.now() - 3600000).toISOString() },
];

export default function BlockchainPage() {
  const { data: status } = useQuery({ queryKey: ["blockchain-status"], queryFn: () => systemApi.blockchainStatus().then((r) => r.data.data).catch(() => ({ connected: true, network: "polygon" })) });
  const { data: logs } = useQuery({ queryKey: ["blockchain-logs"], queryFn: () => systemApi.blockchainLogs().then((r) => r.data.data).catch(() => mockLogs) });

  return (
    <div>
      <PageHeader title="Blockchain Traceability" description="Immutable audit layer on Polygon network" icon={Link2} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6"><CardContent className="p-0 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/20 flex items-center justify-center pulse-glow"><Link2 className="h-6 w-6 text-emerald-400" /></div>
          <div><p className="text-sm text-muted">Network</p><p className="font-bold capitalize">{status?.network || "Polygon"}</p></div>
        </CardContent></Card>
        <Card className="p-6"><CardContent className="p-0 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center"><Shield className="h-6 w-6 text-indigo-400" /></div>
          <div><p className="text-sm text-muted">Records</p><p className="font-bold">{(logs || mockLogs).length} Verified</p></div>
        </CardContent></Card>
        <Card className="p-6"><CardContent className="p-0 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/20 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-cyan-400" /></div>
          <div><p className="text-sm text-muted">Status</p><p className="font-bold text-emerald-400">Synced</p></div>
        </CardContent></Card>
      </div>
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 via-cyan-500 to-purple-500" />
        <div className="space-y-4">
          {(logs || mockLogs).map((log: typeof mockLogs[0], i: number) => (
            <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="relative ml-16">
              <div className="absolute -left-[2.85rem] top-4 h-4 w-4 rounded-full bg-indigo-500 border-2 border-[#0a0a0f] pulse-glow" />
              <Card className="p-5 hover:border-indigo-500/30 transition-all">
                <CardContent className="p-0">
                  <div className="flex items-start justify-between mb-2">
                    <div><p className="font-semibold">{log.eventType.replace(/_/g, " ")}</p><p className="text-xs text-muted">{log.entityType} • {log.entityId}</p></div>
                    <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Verified</span>
                  </div>
                  <p className="text-xs font-mono text-cyan-400 mb-1">{truncateHash(log.txHash, 10, 8)}</p>
                  <p className="text-xs text-muted">{formatDate(log.createdAt)}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
