"use client";
import { useQuery } from "@tanstack/react-query";
import { manufacturingApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";

export default function BOMPage() {
  const [expanded, setExpanded] = useState<string | null>("1");
  const { data } = useQuery({ queryKey: ["boms"], queryFn: () => manufacturingApi.boms().then(r => r.data.data).catch(() => [{
    id: "1", name: "Royal Teak Sofa BoM", finishedProduct: { name: "Royal Teak Sofa Set" }, totalCost: 45000, productionDuration: 480,
    components: [{ product: { name: "Teak Wood Plank" }, quantity: 8, unit: "pcs" }, { product: { name: "Premium Fabric Roll" }, quantity: 12, unit: "m" }, { product: { name: "Hardware Kit" }, quantity: 1, unit: "kit" }],
    operations: [{ name: "Frame Assembly", workCenter: { name: "Assembly Line" }, duration: 180 }, { name: "Polish & Paint", workCenter: { name: "Paint Floor" }, duration: 120 }],
  }])});

  return (
    <div>
      <PageHeader title="Bill of Materials" description="Component trees, operations, and costing" icon={Layers} />
      <div className="space-y-4">
        {(data||[]).map((bom: {id:string; name:string; finishedProduct:{name:string}; totalCost:number; productionDuration:number; components:{product:{name:string};quantity:number;unit:string}[]; operations:{name:string; workCenter:{name:string}; duration:number}[]}) => (
          <Card key={bom.id} className="overflow-hidden">
            <button onClick={() => setExpanded(expanded === bom.id ? null : bom.id)} className="w-full p-5 flex items-center justify-between hover:bg-indigo-500/5 transition-colors">
              <div className="flex items-center gap-3">
                {expanded === bom.id ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                <div className="text-left"><p className="font-semibold">{bom.name}</p><p className="text-sm text-muted">{bom.finishedProduct.name}</p></div>
              </div>
              <div className="text-right text-sm"><p>{formatCurrency(Number(bom.totalCost))}</p><p className="text-muted">{bom.productionDuration} min</p></div>
            </button>
            {expanded === bom.id && (
              <CardContent className="border-t border-indigo-500/10 p-5 space-y-4">
                <div><p className="text-xs font-semibold text-muted uppercase mb-2">Components</p>
                  {bom.components.map((c, i) => (<div key={i} className="flex justify-between py-2 border-b border-indigo-500/5 text-sm"><span>{c.product.name}</span><span>{c.quantity} {c.unit}</span></div>))}
                </div>
                <div><p className="text-xs font-semibold text-muted uppercase mb-2">Operations</p>
                  {bom.operations.map((op, i) => (<div key={i} className="flex justify-between py-2 border-b border-indigo-500/5 text-sm"><span>{op.name} → {op.workCenter.name}</span><span>{op.duration} min</span></div>))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
