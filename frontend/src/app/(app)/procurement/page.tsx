"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Factory, ShoppingBag } from "lucide-react";
import { systemApi } from "@/lib/api";
import { toast } from "sonner";

export default function ProcurementPage() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["procurement-rules"],
    queryFn: () => systemApi.procurementRules().then((r) => r.data.data).catch(() => ({
      rules: [
        { productId: "1", productName: "Royal Teak Sofa Set", suggestedAction: "MANUFACTURING", status: "active", freeQty: 10, reorderPoint: 5 },
        { productId: "2", productName: "Teak Wood Plank", suggestedAction: "PURCHASE", status: "triggered", freeQty: 8, reorderPoint: 50 },
      ],
      summary: { shortages: 3, suggestedPOs: 2, suggestedMOs: 1 },
    })),
  });

  const execute = useMutation({
    mutationFn: (productId: string) => systemApi.executeProcurement(productId),
    onSuccess: () => {
      toast.success("Procurement action triggered");
      queryClient.invalidateQueries({ queryKey: ["procurement-rules"] });
    },
    onError: () => toast.info("Demo mode — action simulated"),
  });

  const rules = data?.rules || [];
  const summary = data?.summary || { shortages: 3, suggestedPOs: 2, suggestedMOs: 1 };

  return (
    <div>
      <PageHeader title="Procurement Automation" description="Auto-create MO or PO based on stock shortages" icon={Zap} action={{ label: "Configure Rules" }} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 border-l-4 border-l-amber-400"><CardContent className="p-0"><p className="text-sm text-muted">Shortages Detected</p><p className="text-3xl font-bold text-amber-400">{summary.shortages}</p></CardContent></Card>
        <Card className="p-6 border-l-4 border-l-indigo-400"><CardContent className="p-0"><p className="text-sm text-muted">Auto POs Suggested</p><p className="text-3xl font-bold text-indigo-400">{summary.suggestedPOs}</p></CardContent></Card>
        <Card className="p-6 border-l-4 border-l-cyan-400"><CardContent className="p-0"><p className="text-sm text-muted">Auto MOs Suggested</p><p className="text-3xl font-bold text-cyan-400">{summary.suggestedMOs}</p></CardContent></Card>
      </div>
      <div className="space-y-4">
        {rules.map((r: { productId: string; productName: string; suggestedAction: string; status: string; freeQty: number; reorderPoint: number }) => (
          <Card key={r.productId} className="p-5"><CardContent className="p-0 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {r.suggestedAction === "MANUFACTURING" ? <Factory className="h-8 w-8 text-cyan-400" /> : <ShoppingBag className="h-8 w-8 text-indigo-400" />}
              <div>
                <p className="font-semibold">{r.productName}</p>
                <p className="text-sm text-muted">Free: {r.freeQty} / Reorder: {r.reorderPoint} → {r.suggestedAction}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={r.status === "triggered" ? "warning" : "success"}>{r.status}</Badge>
              <Button size="sm" variant="glow" onClick={() => execute.mutate(r.productId)}>Execute</Button>
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
