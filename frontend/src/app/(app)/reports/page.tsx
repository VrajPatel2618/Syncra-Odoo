"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportReportExcel, exportReportPdf, type ReportType } from "@/lib/report-export";

const reports: { name: string; type: ReportType; desc: string }[] = [
  { name: "Sales Report", type: "sales", desc: "Revenue, orders, and customer analytics" },
  { name: "Purchase Report", type: "purchase", desc: "Procurement spend and vendor performance" },
  { name: "Inventory Report", type: "inventory", desc: "Stock levels, movements, and valuation" },
  { name: "Manufacturing Report", type: "manufacturing", desc: "Production efficiency and MO tracking" },
  { name: "Vendor Report", type: "vendor", desc: "Lead times, ratings, and spend analysis" },
  { name: "Profit Analytics", type: "profit", desc: "Margin analysis and profitability trends" },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleExport = async (type: ReportType, format: "pdf" | "excel") => {
    const key = `${type}-${format}`;
    setLoading(key);
    try {
      if (format === "pdf") await exportReportPdf(type);
      else await exportReportExcel(type);
      toast.success(`${format.toUpperCase()} downloaded`);
    } catch {
      toast.error("Export failed — please try again");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <PageHeader title="Reports" description="Export PDF, Excel, and AI-generated summaries" icon={BarChart3} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Card key={r.type} className="p-6 hover:border-primary/30 transition-all group">
            <CardContent className="p-0">
              <BarChart3 className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold mb-1">{r.name}</h3>
              <p className="text-sm text-muted mb-4">{r.desc}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={loading !== null}
                  onClick={() => handleExport(r.type, "pdf")}
                >
                  {loading === `${r.type}-pdf` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  PDF
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={loading !== null}
                  onClick={() => handleExport(r.type, "excel")}
                >
                  {loading === `${r.type}-excel` ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
