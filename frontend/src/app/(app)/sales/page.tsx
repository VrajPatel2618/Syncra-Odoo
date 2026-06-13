"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { salesApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

const mockSales = [
  { id: "1", orderNumber: "SO-DEMO001", customer: { name: "Modern Homes Pvt Ltd" }, status: "CONFIRMED", totalAmount: 106198, orderDate: new Date().toISOString(), deliveryDate: new Date(Date.now() + 7*86400000).toISOString() },
  { id: "2", orderNumber: "SO-DEMO002", customer: { name: "Elite Interiors" }, status: "DRAFT", totalAmount: 54999, orderDate: new Date().toISOString() },
];

const columns = [
  { status: "DRAFT", label: "Draft", color: "border-slate-500/30" },
  { status: "CONFIRMED", label: "Confirmed", color: "border-blue-500/30" },
  { status: "PARTIALLY_DELIVERED", label: "Partial", color: "border-amber-500/30" },
  { status: "FULLY_DELIVERED", label: "Delivered", color: "border-emerald-500/30" },
];

export default function SalesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => salesApi.list().then((r) => r.data.data).catch(() => mockSales),
  });
  const orders = data || mockSales;

  return (
    <div>
      <PageHeader title="Sales Management" description="Order lifecycle: Draft → Confirmed → Delivered" icon={ShoppingCart} action={{ label: "+ New Order" }} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {columns.map((col) => (
          <Card key={col.status} className={`p-4 border-t-2 ${col.color}`}>
            <CardContent className="p-0">
              <p className="text-xs text-muted mb-2">{col.label}</p>
              <div className="space-y-2">
                {orders.filter((o: {status:string}) => o.status === col.status).map((o: typeof mockSales[0]) => (
                  <div key={o.id} className="rounded-lg glass p-3 text-sm">
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-muted">{o.customer.name}</p>
                    <p className="text-xs text-indigo-400 mt-1">{formatCurrency(o.totalAmount)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DataTable loading={isLoading} data={orders} columns={[
        { key: "orderNumber", header: "Order #" },
        { key: "customer", header: "Customer", render: (o) => (o.customer as {name:string}).name },
        { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status as string} /> },
        { key: "totalAmount", header: "Total", render: (o) => formatCurrency(o.totalAmount as number) },
        { key: "orderDate", header: "Date", render: (o) => formatDate(o.orderDate as string) },
        { key: "deliveryDate", header: "Delivery", render: (o) => o.deliveryDate ? formatDate(o.deliveryDate as string) : "—" },
        { key: "actions", header: "Actions", render: (o) => (
          <div className="flex gap-2">
            <button className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded" onClick={() => salesApi.deliver(o.id as string).then(() => window.location.reload())}>Deliver</button>
            <button className="text-xs bg-cyan-500 hover:bg-cyan-600 text-white px-2 py-1 rounded" onClick={() => salesApi.invoice(o.id as string).then(() => window.location.reload())}>Invoice</button>
            <button className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded" onClick={() => salesApi.pay(o.id as string).then(() => window.location.reload())}>Pay</button>
          </div>
        )},
      ]} />
    </div>
  );
}
