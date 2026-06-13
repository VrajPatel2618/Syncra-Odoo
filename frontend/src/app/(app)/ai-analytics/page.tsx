"use client";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Sparkles } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from "recharts";

const forecast = [{ week: "W1", demand: 45, forecast: 42 }, { week: "W2", demand: 52, forecast: 50 }, { week: "W3", demand: 48, forecast: 55 }, { week: "W4", demand: 60, forecast: 58 }];

export default function AIAnalyticsPage() {
  const { data: insights } = useQuery({ queryKey: ["ai-insights"], queryFn: () => systemApi.aiInsights().then(r => r.data.data).catch(() => ({
    inventoryForecast: { trend: "declining", criticalItems: 3, recommendation: "Trigger automated procurement" },
    salesForecast: { trend: "growing", projectedRevenue: 2450000 },
    manufacturing: { bottleneck: "Paint Floor", utilization: 78 },
    procurement: { urgentItems: 3, suggestedPOs: 2 },
  }))});

  return (
    <div>
      <PageHeader title="AI Analytics" description="Predictive forecasting and intelligent recommendations" icon={Brain} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[{ t: "Inventory Trend", v: insights?.inventoryForecast?.trend, c: "text-amber-400" }, { t: "Critical Items", v: insights?.inventoryForecast?.criticalItems, c: "text-red-400" }, { t: "Bottleneck", v: insights?.manufacturing?.bottleneck, c: "text-cyan-400" }, { t: "Urgent Procurement", v: insights?.procurement?.urgentItems, c: "text-indigo-400" }].map((s) => (
          <Card key={s.t} className="p-5"><CardContent className="p-0"><p className="text-sm text-muted">{s.t}</p><p className={`text-xl font-bold capitalize ${s.c}`}>{s.v}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6"><CardHeader className="p-0 mb-4"><CardTitle>Demand Forecast</CardTitle></CardHeader><CardContent className="p-0">
          <ResponsiveContainer width="100%" height={250}><AreaChart data={forecast}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="week" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip contentStyle={{ background: "#1e293b", borderRadius: 12 }} /><Area type="monotone" dataKey="forecast" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} /><Area type="monotone" dataKey="demand" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} /></AreaChart></ResponsiveContainer>
        </CardContent></Card>
        <Card className="p-6"><CardHeader className="p-0 mb-4"><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-purple-400" /> AI Recommendations</CardTitle></CardHeader><CardContent className="p-0 space-y-3">
          <div className="rounded-xl bg-indigo-500/10 p-4 border border-indigo-500/20 text-sm">{insights?.inventoryForecast?.recommendation}</div>
          <div className="rounded-xl bg-cyan-500/10 p-4 border border-cyan-500/20 text-sm">Schedule preventive maintenance on Paint Floor ({insights?.manufacturing?.utilization}% utilization)</div>
          <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20 text-sm">Create {insights?.procurement?.suggestedPOs} purchase orders for raw materials</div>
        </CardContent></Card>
      </div>
    </div>
  );
}
