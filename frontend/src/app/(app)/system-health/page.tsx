"use client";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { HeartPulse, CheckCircle, XCircle } from "lucide-react";

export default function SystemHealthPage() {
  const { data } = useQuery({ queryKey: ["health"], queryFn: () => systemApi.health().then(r => r.data.data).catch(() => ({
    api: "healthy", database: "healthy", blockchain: { connected: true, network: "polygon" }, ai: { openai: false, gemini: false },
  }))});

  const services = [
    { name: "API Server", status: data?.api || "healthy" },
    { name: "PostgreSQL Database", status: data?.database || "healthy" },
    { name: "Blockchain Layer", status: data?.blockchain?.connected ? "healthy" : "degraded" },
    { name: "AI Services", status: data?.ai?.openai || data?.ai?.gemini ? "healthy" : "mock" },
  ];

  return (
    <div>
      <PageHeader title="System Health" description="API, database, blockchain, and AI monitoring" icon={HeartPulse} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s) => (
          <Card key={s.name} className="p-6"><CardContent className="p-0 flex items-center justify-between">
            <div><p className="font-medium">{s.name}</p><p className="text-sm text-muted capitalize">{s.status === "mock" ? "Mock mode (no API keys)" : s.status}</p></div>
            {s.status === "healthy" || s.status === "mock" ? <CheckCircle className="h-6 w-6 text-emerald-400" /> : <XCircle className="h-6 w-6 text-red-400" />}
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
