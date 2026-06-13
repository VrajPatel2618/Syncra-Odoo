"use client";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function InvoicesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["invoices"], queryFn: () => systemApi.invoices().then(r => r.data.data) });

  const downloadInvoice = (invoice: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("INVOICE", 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`, 14, 30);
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 14, 35);
    doc.text(`Status: ${invoice.status}`, 14, 40);

    if (invoice.salesOrder?.customer) {
      doc.text(`Bill To: ${invoice.salesOrder.customer.name}`, 14, 50);
    }

    autoTable(doc, {
      startY: 60,
      head: [['Description', 'Amount']],
      body: [
        ['Sales Order Payment', formatCurrency(Number(invoice.totalAmount))]
      ],
    });

    doc.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div>
      <PageHeader title="Invoice & Billing" description="Modern invoice layouts with PDF export" icon={FileText} />
      <DataTable loading={isLoading} data={data||[]} columns={[
        { key: "invoiceNumber", header: "Invoice #" }, 
        { key: "customer", header: "Customer", render: (i: any) => i.salesOrder?.customer?.name || "Unknown" },
        { key: "totalAmount", header: "Amount", render: (i: any) => formatCurrency(Number(i.totalAmount)) },
        { key: "status", header: "Status", render: (i: any) => <Badge variant={i.status === "PAID" ? "success" : "warning"}>{String(i.status)}</Badge> },
        { key: "actions", header: "Actions", render: (i: any) => (
          i.status === "PAID" ? (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => downloadInvoice(i)}>
              <Download className="w-3 h-3 mr-1" /> Download Bill
            </Button>
          ) : <span className="text-stone-500 text-xs">—</span>
        )}
      ]} />
    </div>
  );
}
