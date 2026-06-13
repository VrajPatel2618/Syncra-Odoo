"use client";

import { useRef, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportProductsCsv, exportReportExcel, exportReportPdf } from "@/lib/report-export";

const exportItems = [
  { icon: FileSpreadsheet, label: "Export Inventory", fmt: "Excel", action: () => exportReportExcel("inventory") },
  { icon: FileText, label: "Export Sales Report", fmt: "PDF", action: () => exportReportPdf("sales") },
  { icon: FileSpreadsheet, label: "Export Products", fmt: "CSV", action: () => exportProductsCsv() },
] as const;

export default function ExportImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (label: string, action: () => Promise<void>) => {
    setLoading(label);
    try {
      await action();
      toast.success("File downloaded");
    } catch {
      toast.error("Export failed — please try again");
    } finally {
      setLoading(null);
    }
  };

  const handleImport = (files: FileList | null) => {
    if (!files?.length) return;
    const file = files[0];
    const valid = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!valid) {
      toast.error("Please upload a CSV or Excel file");
      return;
    }
    toast.success(`"${file.name}" received — import will sync when backend is connected`);
  };

  return (
    <div>
      <PageHeader title="Export & Import" description="Bulk CSV/Excel upload and data export" icon={Upload} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="p-8 border-2 border-dashed border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleImport(e.dataTransfer.files);
          }}
        >
          <CardContent className="p-0 text-center">
            <Upload className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Import Data</h3>
            <p className="text-sm text-muted mb-4">Drag & drop CSV or Excel files</p>
            <p className="text-xs text-muted">Products · Inventory · Customers · Vendors</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleImport(e.target.files)}
            />
          </CardContent>
        </Card>
        <div className="space-y-4">
          {exportItems.map((e) => (
            <Card
              key={e.label}
              className="p-5 cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => !loading && handleExport(e.label, e.action)}
            >
              <CardContent className="p-0 flex items-center gap-4">
                {loading === e.label ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : (
                  <e.icon className="h-8 w-8 text-primary" />
                )}
                <div>
                  <p className="font-medium">{e.label}</p>
                  <p className="text-xs text-muted">{e.fmt} format</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
