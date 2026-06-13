"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const kpis = [
  { name: "Inventory Turnover", value: "4.2x", trend: "+8%", up: true },
  { name: "Order Fulfillment", value: "94%", trend: "+3%", up: true },
  { name: "Manufacturing Efficiency", value: "87%", trend: "-2%", up: false },
  { name: "Procurement Cycle", value: "5.2 days", trend: "-12%", up: true },
  { name: "On-Time Delivery", value: "91%", trend: "+5%", up: true },
  { name: "Stock Accuracy", value: "99.2%", trend: "+1%", up: true },
];

const chartData = [{ metric: "Jan", efficiency: 82 }, { metric: "Feb", efficiency: 85 }, { metric: "Mar", efficiency: 83 }, { metric: "Apr", efficiency: 87 }, { metric: "May", efficiency: 89 }, { metric: "Jun", efficiency: 87 }];

export default function KPIAnalyticsPage() {
  return (
    <div>
      <PageHeader title="KPI Analytics" description="Operational KPIs and trend indicators" icon={TrendingUp} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.name} className="p-5"><CardContent className="p-0">
            <p className="text-sm text-muted">{k.name}</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-2xl font-bold">{k.value}</p>
              <span className={`flex items-center gap-1 text-xs ${k.up ? "text-emerald-400" : "text-red-400"}`}>
                {k.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{k.trend}
              </span>
            </div>
          </CardContent></Card>
        ))}
      </div>
      <Card className="p-6"><CardContent className="p-0">
        <h3 className="font-semibold mb-4">Manufacturing Efficiency Trend</h3>
        <ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#334155" /><XAxis dataKey="metric" stroke="#64748b" /><YAxis stroke="#64748b" /><Tooltip contentStyle={{ background: "#1e293b", borderRadius: 12 }} /><Bar dataKey="efficiency" fill="#6366f1" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
      </CardContent></Card>
    </div>
  );
}
