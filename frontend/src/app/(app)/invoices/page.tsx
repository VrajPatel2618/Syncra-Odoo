"use client";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { FileText } from "lucide-react";

export default function InvoicesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => systemApi.invoices().then(r => r.data.data) });
  return (<div><PageHeader title="Invoice & Billing" description="Modern invoice layouts with PDF export" icon={FileText} />
    <DataTable loading={isLoading} data={data||[]} columns={[
      { key: "invoiceNumber", header: "Invoice #" }, { key: "totalAmount", header: "Amount", render: (i) => formatCurrency(Number(i.totalAmount)) },
      { key: "status", header: "Status", render: (i) => <Badge variant={i.status === "PAID" ? "success" : "warning"}>{String(i.status)}</Badge> },
    ]} /></div>);
}
