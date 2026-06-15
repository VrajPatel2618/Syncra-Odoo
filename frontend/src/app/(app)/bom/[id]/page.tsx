"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, manufacturingApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Layers, Plus, Trash, Calculator, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function EditBOMPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const bomId = params.id;
  
  const [name, setName] = useState("");
  const [finishedProductId, setFinishedProductId] = useState("");
  const [components, setComponents] = useState<any[]>([]);
  const [operations, setOperations] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [productionDuration, setProductionDuration] = useState(0);
  const [qualityStandard, setQualityStandard] = useState("Standard");
  const [impactQty, setImpactQty] = useState(10);
  const [activeTab, setActiveTab] = useState<"edit" | "impact">("edit");

  const { data: bomsRes } = useQuery({ queryKey: ["boms"], queryFn: () => manufacturingApi.boms().then(r => r.data.data) });
  const { data: productsRes } = useQuery({ queryKey: ["products"], queryFn: () => productsApi.list() });
  const { data: workCentersRes } = useQuery({ queryKey: ["workCenters"], queryFn: () => manufacturingApi.workCenters() });

  const { data: impactData } = useQuery({ 
    queryKey: ["bomImpact", bomId, impactQty], 
    queryFn: () => manufacturingApi.getBomImpact(bomId, impactQty).then(r => r.data.data),
    enabled: activeTab === "impact"
  });

  const products = productsRes?.data?.data || [];
  const workCenters = workCentersRes?.data?.data || [];
  const finishedProducts = products.filter((p: any) => p.isFinishedGood);
  const componentProducts = products.filter((p: any) => p.isRawMaterial || p.isFinishedGood);

  useEffect(() => {
    if (bomsRes) {
      const bom = bomsRes.find((b: any) => b.id === bomId);
      if (bom) {
        setName(bom.name);
        setFinishedProductId(bom.finishedProductId);
        setTotalCost(Number(bom.totalCost));
        setProductionDuration(bom.productionDuration);
        setQualityStandard(bom.qualityStandard || "Standard");
        setComponents(bom.components.map((c: any) => ({ productId: c.productId, quantity: c.quantity, unit: c.unit })));
        setOperations(bom.operations.map((o: any) => ({ name: o.name, duration: o.duration, workCenterId: o.workCenterId })));
      }
    }
  }, [bomsRes, bomId]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => manufacturingApi.updateBom(bomId, data),
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
    updateMutation.mutate({ name, finishedProductId, totalCost, productionDuration, qualityStandard, components, operations });
  };

  return (
    <div>
      <PageHeader title="Manage Bill of Materials" description="Edit recipe or calculate production impact" icon={Layers} />
      
      <div className="flex space-x-4 mb-6 border-b border-[var(--border)]">
        <button className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'edit' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`} onClick={() => setActiveTab('edit')}>
          Edit Definition (New Version)
        </button>
        <button className={`py-2 px-4 border-b-2 font-medium text-sm ${activeTab === 'impact' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent text-[var(--muted)] hover:text-[var(--foreground)]'}`} onClick={() => setActiveTab('impact')}>
          Consumption Impact
        </button>
      </div>

      {activeTab === 'edit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Components</CardTitle><Button size="sm" variant="outline" onClick={addComponent}><Plus className="h-4 w-4 mr-1"/> Add</Button></CardHeader>
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
                    }} min="1" />
                    <input type="text" className="w-24 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={comp.unit} onChange={e => {
                      const newC = [...components]; newC[idx].unit = e.target.value; setComponents(newC);
                    }} />
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeComponent(idx)}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Operations</CardTitle><Button size="sm" variant="outline" onClick={addOperation}><Plus className="h-4 w-4 mr-1"/> Add</Button></CardHeader>
              <CardContent className="space-y-4">
                {operations.map((op, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <input type="text" className="flex-1 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={op.name} onChange={e => {
                      const newO = [...operations]; newO[idx].name = e.target.value; setOperations(newO);
                    }} />
                    <select className="flex-1 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={op.workCenterId} onChange={e => {
                      const newO = [...operations]; newO[idx].workCenterId = e.target.value; setOperations(newO);
                    }}>
                      <option value="">Select Work Center</option>
                      {workCenters.map((wc: any) => <option key={wc.id} value={wc.id}>{wc.name}</option>)}
                    </select>
                    <input type="number" className="w-24 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={op.duration} onChange={e => {
                      const newO = [...operations]; newO[idx].duration = Number(e.target.value); setOperations(newO);
                    }} min="1" />
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeOperation(idx)}><Trash className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>General Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1">BoM Name</label>
                  <input type="text" className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={name} onChange={e => setName(e.target.value)} />
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
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Est. Cost</label>
                    <input type="number" className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={totalCost} onChange={e => setTotalCost(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Duration (min)</label>
                    <input type="number" className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={productionDuration} onChange={e => setProductionDuration(Number(e.target.value))} />
                  </div>
                  <div className="col-span-2 mt-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Quality Standard</label>
                    <input type="text" className="w-full border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm text-sm p-2 border" value={qualityStandard} onChange={e => setQualityStandard(e.target.value)} placeholder="e.g. ISO 9001:2015" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-[var(--surface-2)] border-[var(--border)] rounded-md p-4 mb-4">
              <p className="text-sm text-[var(--primary)]">
                <strong>Note:</strong> Editing this BoM will create a new version and deactivate the current one to preserve the audit trail.
              </p>
            </div>

            <Button 
              className="w-full bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white" 
              onClick={handleSave} 
              disabled={!name || !finishedProductId || components.length === 0 || operations.length === 0 || updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save New Version"}
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'impact' && (
        <div className="space-y-6 max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5 text-[var(--primary)]" /> Production Impact Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6 bg-[var(--surface-2)] p-4 rounded-lg border border-[var(--border)]">
                <label className="font-medium text-[var(--foreground)]">Quantity to Produce:</label>
                <input 
                  type="number" 
                  className="w-32 border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] rounded-md shadow-sm p-2 border focus:ring-[var(--primary)] focus:border-[var(--primary)]" 
                  value={impactQty} 
                  onChange={e => setImpactQty(Number(e.target.value))} 
                  min="1" 
                />
                <span className="text-sm text-[var(--muted)]">units of {name}</span>
              </div>

              {impactData && (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-[var(--foreground)]">Component Requirements</h3>
                    <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                      <table className="min-w-full divide-y divide-[var(--border)]">
                        <thead className="bg-[var(--surface-2)]">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase">Component</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase">Required</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase">Available</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-[var(--surface)] divide-y divide-[var(--border)]">
                          {impactData.components.map((c: any, i: number) => (
                            <tr key={i}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--foreground)]">{c.product?.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)] text-right">{c.required}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--muted)] text-right">{c.available}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-right flex justify-end">
                                {c.shortage > 0 ? (
                                  <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md">
                                    <AlertTriangle className="h-4 w-4" /> Shortage: {c.shortage}
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                    <CheckCircle className="h-4 w-4" /> In Stock
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-[var(--foreground)] flex items-center justify-between">
                      <span>Operations Time</span>
                      <span className="text-[var(--primary)] bg-[var(--surface-2)] px-3 py-1 rounded-full text-sm">Total: {impactData.totalDuration} min</span>
                    </h3>
                    <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] p-4 space-y-3">
                      {impactData.operations.map((o: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 border-[var(--border)]">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[var(--foreground)]">{o.name}</span>
                            <span className="text-[var(--muted)] text-sm">→ {o.workCenter?.name}</span>
                          </div>
                          <span className="text-[var(--primary)] font-medium">{o.duration} min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
