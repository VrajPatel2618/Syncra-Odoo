"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Factory, Play, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { manufacturingApi } from "@/lib/api";
import { toast } from "sonner";

export default function ManufacturingPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [bomId, setBomId] = useState("");
  const [workCenterId, setWorkCenterId] = useState("");
  const [quantity, setQuantity] = useState<number | string>(1);

  const { data: ordersData, refetch } = useQuery({
    queryKey: ["manufacturing-orders"],
    queryFn: () => manufacturingApi.orders().then((r) => r.data.data),
  });

  const { data: bomsData } = useQuery({
    queryKey: ["boms"],
    queryFn: () => manufacturingApi.boms().then((r) => r.data.data),
  });

  const { data: workCentersData } = useQuery({
    queryKey: ["work-centers"],
    queryFn: () => manufacturingApi.workCenters().then((r) => r.data.data),
  });

  const orders = ordersData || [];
  const boms = bomsData || [];
  const workCenters = workCentersData || [];

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!bomId || !workCenterId) throw new Error("Please select a BOM and Work Center.");
      return manufacturingApi.createOrder({ bomId, workCenterId, quantity: Number(quantity) || 1 });
    },
    onSuccess: () => {
      toast.success("Manufacturing Order created!");
      setShowModal(false);
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to create MO");
    }
  });

  const handleStart = async (id: string) => {
    try {
      await manufacturingApi.startOrder(id);
      toast.success("Production started!");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Action failed");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await manufacturingApi.completeOrder(id);
      toast.success("Manufacturing order completed!");
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Action failed");
    }
  };

  return (
    <div>
      <PageHeader 
        title="Manufacturing" 
        description="Digital factory board — MO → Work Orders → Production" 
        icon={Factory} 
        action={{ label: "+ New MO", onClick: () => setShowModal(true) }} 
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full text-center text-[var(--muted)] p-8">No manufacturing orders found.</div>
        ) : orders.map((mo: any) => (
          <Card key={mo.id} className="p-6 hover:border-indigo-500/30 transition-all">
            <CardContent className="p-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="font-bold text-lg">{mo.orderNumber}</p>
                  <p className="text-sm text-muted">{mo.bom?.finishedProduct?.name}</p>
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
              {mo.status === "PLANNED" && (
                <Button variant="secondary" size="sm" className="w-full" onClick={() => handleStart(mo.id)}>
                  <Play className="h-4 w-4" /> Start Production
                </Button>
              )}
              {mo.status === "IN_PROGRESS" && (
                <Button variant="glow" size="sm" className="w-full" onClick={() => handleComplete(mo.id)}>
                  <CheckCircle className="h-4 w-4" /> Complete Production
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-[var(--border)]">
              <h2 className="text-lg font-semibold">Create Manufacturing Order</h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--muted)] hover:text-white transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Bill of Material (BOM)</label>
                <select 
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-white"
                  value={bomId} onChange={(e) => setBomId(e.target.value)}
                >
                  <option value="">Select a BOM...</option>
                  {boms.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.finishedProduct?.name || b.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Work Center</label>
                <select 
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-white"
                  value={workCenterId} onChange={(e) => setWorkCenterId(e.target.value)}
                >
                  <option value="">Select a Work Center...</option>
                  {workCenters.map((wc: any) => (
                    <option key={wc.id} value={wc.id}>{wc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Target Quantity</label>
                <input 
                  type="number" min="1"
                  className="w-full bg-[var(--background)] border border-[var(--border)] rounded-md px-3 py-2 text-sm text-white"
                  value={quantity} onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <Button 
                className="w-full mt-4" 
                variant="glow" 
                onClick={() => createOrder.mutate()}
                disabled={createOrder.isPending}
              >
                {createOrder.isPending ? "Creating..." : "Create MO"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
