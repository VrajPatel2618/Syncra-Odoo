"use client";
import { useQuery } from "@tanstack/react-query";
import { purchaseApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

export default function PurchasesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["purchases"], queryFn: () => purchaseApi.list().then(r => r.data.data).catch(() => [
    { orderNumber: "PO-DEMO001", vendor: { name: "Gujarat Timber" }, status: "CONFIRMED", totalAmount: 590000 },
  ])});
  return (<div><PageHeader title="Purchase Management" description="Draft → Confirmed → Received workflow" icon={ShoppingBag} action={{ label: "+ New PO", href: "/purchases/new" }} />
    <DataTable loading={isLoading} data={data||[]} columns={[
      { key: "orderNumber", header: "PO #" }, { key: "vendor", header: "Vendor", render: (o) => (o.vendor as {name:string})?.name },
      { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status as string} /> },
      { key: "totalAmount", header: "Total", render: (o) => formatCurrency(Number(o.totalAmount)) },
    ]} /></div>);
}
