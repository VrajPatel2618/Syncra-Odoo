"use client";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["payments"], queryFn: () => systemApi.payments().then(r => r.data.data) });
  return (<div><PageHeader title="Payment Management" description="Financial analytics and transaction timelines" icon={CreditCard} />
    <DataTable loading={isLoading} data={data||[]} columns={[
      { key: "paymentNumber", header: "Payment #" }, { key: "amount", header: "Amount", render: (p) => formatCurrency(Number(p.amount)) },
      { key: "method", header: "Method" }, { key: "status", header: "Status", render: (p) => <Badge variant={p.status === "COMPLETED" ? "success" : "warning"}>{String(p.status)}</Badge> },
    ]} /></div>);
}
