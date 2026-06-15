"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, manufacturingApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Layers, Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function NewBOMPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState("");
  const [finishedProductId, setFinishedProductId] = useState("");
  const [components, setComponents] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [productionDuration, setProductionDuration] = useState(0);
  const [qualityStandard, setQualityStandard] = useState("Standard");

  const { data: productsRes } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });
  const { data: workCentersRes } = useQuery({ queryKey: ["workCenters"], queryFn: () => manufacturingApi.workCenters() });

  const products = productsRes?.data?.data || [];
  const workCenters = workCentersRes?.data?.data || [];
  const finishedProducts = products.filter((p: any) => p.isFinishedGood);
  const componentProducts = products.filter((p: any) => p.isRawMaterial || p.isFinishedGood);

  const createMutation = useMutation({
    mutationFn: (data: any) => manufacturingApi.createBom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      router.push("/bom");
    }
  });

  const addComponent = () => setComponents([...components, { productId: "", quantity: 1, unit: "pcs" }]);
  const removeComponent = (index: number) => setComponents(components.filter((_, i) => i !== index));

  const addOperation = () => setOperations([...operations, { name: "", duration: 10, workCenterId: "" }]);
  const removeOperation = (index: number) => setOperations(operations.filter((_, i) => i !== index));

  const handleSave = () => {
    createMutation.mutate({
      name,
      finishedProductId,
      totalCost,
      productionDuration,
      qualityStandard,
      components,
      operations
    });
  };

  return (
    <div>
      <PageHeader title="Create Bill of Materials" description="Define recipe and operations" icon={Layers} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Components</CardTitle><Button size="sm" variant="outline" onClick={addComponent}><Plus className="h-4 w-4 mr-1"/> Add Component</Button></CardHeader>
            <CardContent className="space-y-4">
              {components.map((comp, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <select className="flex-1 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={comp.productId} onChange={e => {
                    const newC = [...components]; newC[idx].productId = e.target.value; setComponents(newC);
                  }}>
                    <option value="">Select Component</option>
                    {componentProducts.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" className="w-24 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={comp.quantity} onChange={e => {
                    const newC = [...components]; newC[idx].quantity = Number(e.target.value); setComponents(newC);
                  }} min="1" placeholder="Qty" />
                  <input type="text" className="w-24 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={comp.unit} onChange={e => {
                    const newC = [...components]; newC[idx].unit = e.target.value; setComponents(newC);
                  }} placeholder="Unit" />
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeComponent(idx)}><Trash className="h-4 w-4" /></Button>
                </div>
              ))}
              {components.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">No components added yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Operations</CardTitle><Button size="sm" variant="outline" onClick={addOperation}><Plus className="h-4 w-4 mr-1"/> Add Operation</Button></CardHeader>
            <CardContent className="space-y-4">
              {operations.map((op, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                  <input type="text" className="flex-1 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={op.name} onChange={e => {
                    const newO = [...operations]; newO[idx].name = e.target.value; setOperations(newO);
                  }} placeholder="Operation Name (e.g. Assembly)" />
                  <select className="flex-1 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={op.workCenterId} onChange={e => {
                    const newO = [...operations]; newO[idx].workCenterId = e.target.value; setOperations(newO);
                  }}>
                    <option value="">Select Work Center</option>
                    {workCenters.map((wc: any) => <option key={wc.id} value={wc.id}>{wc.name}</option>)}
                  </select>
                  <input type="number" className="w-24 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={op.duration} onChange={e => {
                    const newO = [...operations]; newO[idx].duration = Number(e.target.value); setOperations(newO);
                  }} min="1" placeholder="Mins" />
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeOperation(idx)}><Trash className="h-4 w-4" /></Button>
                </div>
              ))}
              {operations.length === 0 && <p className="text-sm text-[var(--muted)] text-center py-4">No operations added yet.</p>}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">BoM Name</label>
                <input type="text" className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Default Smartphone BoM" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Finished Product</label>
                <select className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={finishedProductId} onChange={e => setFinishedProductId(e.target.value)}>
                  <option value="">Select Product...</option>
                  {finishedProducts.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Est. Total Cost</label>
                  <input type="number" className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={totalCost} onChange={e => setTotalCost(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Duration (mins)</label>
                  <input type="number" className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={productionDuration} onChange={e => setProductionDuration(Number(e.target.value))} />
                </div>
                <div className="col-span-2 mt-2">
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Quality Standard</label>
                  <input type="text" className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={qualityStandard} onChange={e => setQualityStandard(e.target.value)} placeholder="e.g. ISO 9001:2015" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white" 
            onClick={handleSave} 
            disabled={!name || !finishedProductId || components.length === 0 || operations.length === 0 || createMutation.isPending}
          >
            {createMutation.isPending ? "Saving..." : "Save BoM"}
          </Button>
        </div>
      </div>
    </div>
  );
}
