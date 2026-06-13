"use client";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["payments"], queryFn: () => systemApi.payments().then(r => r.data.data) });

  const downloadReceipt = (payment: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("PAYMENT RECEIPT", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Receipt Number: ${payment.paymentNumber}`, 14, 30);
    doc.text(`Date: ${new Date(payment.createdAt).toLocaleDateString()}`, 14, 35);
    doc.text(`Status: ${payment.status}`, 14, 40);
    doc.text(`Payment Method: ${payment.method}`, 14, 45);

    if (payment.customer) {
      doc.text(`Received From: ${payment.customer.name}`, 14, 55);
    }
    if (payment.salesOrder) {
      doc.text(`For Order: ${payment.salesOrder.orderNumber}`, 14, 60);
    }

    autoTable(doc, {
      startY: 70,
      head: [['Description', 'Amount Paid']],
      body: [
        ['Order Payment', formatCurrency(Number(payment.amount))]
      ],
    });

    doc.save(`${payment.paymentNumber}_receipt.pdf`);
  };

  return (
    <div>
      <PageHeader title="Payment Management" description="Financial analytics and transaction timelines" icon={CreditCard} />
      <DataTable loading={isLoading} data={data||[]} columns={[
        { key: "paymentNumber", header: "Payment #" }, 
        { key: "customer", header: "Customer", render: (p: any) => p.customer?.name || "Unknown" },
        { key: "amount", header: "Amount", render: (p: any) => formatCurrency(Number(p.amount)) },
        { key: "method", header: "Method" }, 
        { key: "status", header: "Status", render: (p: any) => <Badge variant={p.status === "COMPLETED" ? "success" : "warning"}>{String(p.status)}</Badge> },
        { key: "actions", header: "Actions", render: (p: any) => (
          p.status === "COMPLETED" ? (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => downloadReceipt(p)}>
              <Download className="w-3 h-3 mr-1" /> Download Receipt
            </Button>
          ) : <span className="text-stone-500 text-xs">—</span>
        )}
      ]} />
    </div>
  );
}
