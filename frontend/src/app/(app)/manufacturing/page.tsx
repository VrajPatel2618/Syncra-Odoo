"use client";

import { useQuery } from "@tanstack/react-query";
import { Factory, Play, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { manufacturingApi } from "@/lib/api";
import { toast } from "sonner";

const mockMOs = [
  { id: "1", orderNumber: "MO-DEMO001", bom: { finishedProduct: { name: "Royal Teak Sofa Set" }, components: [{ product: { name: "Teak Wood" }, quantity: 8 }] }, quantity: 5, producedQty: 0, status: "IN_PROGRESS", workCenter: { name: "Assembly Line" } },
  { id: "2", orderNumber: "MO-DEMO002", bom: { finishedProduct: { name: "King Size Bed Frame" } }, quantity: 10, producedQty: 0, status: "PLANNED", workCenter: { name: "Paint Floor" } },
];

export default function ManufacturingPage() {
  const { data, refetch } = useQuery({
    queryKey: ["manufacturing-orders"],
    queryFn: () => manufacturingApi.orders().then((r) => r.data.data).catch(() => mockMOs),
  });
  const orders = data || mockMOs;

  const handleComplete = async (id: string) => {
    try {
      await manufacturingApi.completeOrder(id);
      toast.success("Manufacturing order completed");
      refetch();
    } catch {
      toast.info("Demo mode — action simulated");
    }
  };

  return (
    <div>
      <PageHeader title="Manufacturing" description="Digital factory board — MO → Work Orders → Production" icon={Factory} action={{ label: "+ New MO" }} />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.map((mo: typeof mockMOs[0]) => (
          <Card key={mo.id} className="p-6 hover:border-indigo-500/30 transition-all">
            <CardContent className="p-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-lg">{mo.orderNumber}</p>
                  <p className="text-sm text-muted">{mo.bom.finishedProduct.name}</p>
                </div>
                <StatusBadge status={mo.status} />
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-muted">Quantity</span><span>{mo.quantity} units</span></div>
                <div className="flex justify-between"><span className="text-muted">Work Center</span><span>{mo.workCenter?.name}</span></div>
                <div className="flex justify-between"><span className="text-muted">Produced</span><span>{mo.producedQty}/{mo.quantity}</span></div>
              </div>
              <div className="h-2 rounded-full bg-indigo-500/20 mb-4">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${(mo.producedQty / mo.quantity) * 100}%` }} />
              </div>
              {mo.status === "IN_PROGRESS" && (
                <Button variant="glow" size="sm" className="w-full" onClick={() => handleComplete(mo.id)}>
                  <CheckCircle className="h-4 w-4" /> Complete Production
                </Button>
              )}
              {mo.status === "PLANNED" && (
                <Button variant="secondary" size="sm" className="w-full">
                  <Play className="h-4 w-4" /> Start Production
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
