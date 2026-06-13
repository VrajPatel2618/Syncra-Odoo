"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { dashboardApi, systemApi } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const mockKpis = {
  totalSalesOrders: 24, pendingDeliveries: 5, manufacturingOrders: 3,
  delayedOrders: 2, inventoryAlerts: 4, totalRevenue: 2450000,
};

const mockChart = [
  { month: "Jan", revenue: 180000, orders: 8 },
  { month: "Feb", revenue: 220000, orders: 12 },
  { month: "Mar", revenue: 195000, orders: 10 },
  { month: "Apr", revenue: 310000, orders: 15 },
  { month: "May", revenue: 280000, orders: 13 },
  { month: "Jun", revenue: 350000, orders: 18 },
];

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.stats().then((r) => r.data.data).catch(() => null),
  });

  const { data: insights } = useQuery({
    queryKey: ["ai-insights"],
    queryFn: () => systemApi.aiInsights().then((r) => r.data.data).catch(() => null),
  });

  const kpis = stats?.kpis || mockKpis;
  const chartData = stats?.charts?.monthlySales || mockChart;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        description="Live view — updated when backend is connected"
        breadcrumb="Universal Systems Inc."
      />

      {/* KPI row — dense, utilitarian */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Open Sales Orders", val: formatNumber(kpis.totalSalesOrders), note: "+3 this week", show: true },
          { label: "Pending Deliveries", val: formatNumber(kpis.pendingDeliveries), note: "2 due today", show: true },
          { label: "MOs In Progress", val: formatNumber(kpis.manufacturingOrders), note: "Paint floor busy", show: !stats?.isLimited },
          { label: "Low Stock Alerts", val: formatNumber(kpis.inventoryAlerts), note: "Action needed", warn: true, show: !stats?.isLimited },
        ]
        .filter(k => k.show)
        .map((k) => (
          <div key={k.label} className={`stat-card ${k.warn ? "border-l-[var(--warning)]" : ""}`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">{k.label}</p>
            <p className="text-2xl font-bold mt-1">{k.val}</p>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">{k.note}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Revenue (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted)" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#9a3412" fill="#9a3412" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!stats?.isLimited && (
              <div className="p-3 rounded border border-[var(--border)] bg-[var(--background)]">
                <p className="font-semibold text-xs uppercase text-[var(--muted)]">AI says</p>
                <p className="mt-1 text-[13px]">{insights?.inventoryForecast?.recommendation || "Check teak wood stock before Monday MO."}</p>
              </div>
            )}
            <div className="p-3 rounded border border-[var(--border)] bg-[var(--background)]">
              <p className="font-semibold text-xs uppercase text-[var(--muted)]">{stats?.isLimited ? "My Revenue YTD" : "Revenue YTD"}</p>
              <p className="mt-1 text-lg font-bold">{formatCurrency(kpis.totalRevenue)}</p>
            </div>
            {!stats?.isLimited && (
              <div className="p-3 rounded border border-[var(--border)] bg-[var(--background)]">
                <p className="font-semibold text-xs uppercase text-[var(--muted)]">Blockchain</p>
                <p className="mt-1 text-[13px] text-[var(--accent)]">Audit logs syncing ✓</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Orders per Month</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="#0f766e" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
