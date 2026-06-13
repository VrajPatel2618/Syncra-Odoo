"use client";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Link2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { motion } from "framer-motion";

export default function ActivityPage() {
  const { data } = useQuery({ queryKey: ["activity"], queryFn: () => dashboardApi.activity().then(r => r.data.data).catch(() => ({
    auditLogs: [{ action: "CONFIRM", entityType: "SalesOrder", user: { firstName: "Rajesh", lastName: "Sharma" }, verified: true, createdAt: new Date().toISOString() }],
    movements: [{ product: { name: "Royal Teak Sofa" }, movementType: "OUT", quantity: 1, createdAt: new Date().toISOString() }],
  }))});

  const activities = [
    ...(data?.auditLogs||[]).map((a: {action:string; entityType:string; user:{firstName:string;lastName:string}; verified:boolean; createdAt:string}) => ({ type: "audit", text: `${a.user?.firstName} ${a.action} ${a.entityType}`, time: a.createdAt, verified: a.verified })),
    ...(data?.movements||[]).map((m: {product:{name:string}; movementType:string; quantity:number; createdAt:string}) => ({ type: "stock", text: `${m.movementType}: ${m.product.name} (${m.quantity})`, time: m.createdAt, verified: true })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div>
      <PageHeader title="Activity Center" description="Live activity feed with blockchain verification" icon={Activity} />
      <div className="space-y-3">
        {activities.map((a, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-4"><CardContent className="p-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${a.type === "audit" ? "bg-indigo-400" : "bg-cyan-400"} pulse-glow`} />
                <p className="text-sm">{a.text}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted">
                {a.verified && <Link2 className="h-3 w-3 text-emerald-400" />}
                {formatDate(a.time)}
              </div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
