"use client";
import { useQuery } from "@tanstack/react-query";
import { purchaseApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { canWrite } from "@/lib/permissions";

export default function PurchasesPage() {
  const user = useAuthStore((s) => s.user);
  const hasWriteAccess = canWrite(user?.role, "purchase");

  const { data, isLoading } = useQuery({ queryKey: ["purchases"], queryFn: () => purchaseApi.list().then(r => r.data.data) });
  return (<div><PageHeader title="Purchase Management" description="Draft → Confirmed → Received workflow" icon={ShoppingBag} action={hasWriteAccess ? { label: "+ New PO", href: "/purchases/new" } : undefined} />
    <DataTable loading={isLoading} data={data||[]} columns={[
      { key: "orderNumber", header: "PO #" }, { key: "vendor", header: "Vendor", render: (o) => (o.vendor as {name:string})?.name },
      { key: "status", header: "Status", render: (o) => <StatusBadge status={o.status as string} /> },
      { key: "totalAmount", header: "Total", render: (o) => formatCurrency(Number(o.totalAmount)) },
    ]} /></div>);
}
