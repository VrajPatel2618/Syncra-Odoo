"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { manufacturingApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Layers, ChevronDown, ChevronRight, Plus, Copy, Trash, Power, PowerOff, Edit } from "lucide-react";
import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BOMPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  const { data: boms } = useQuery({ 
    queryKey: ["boms"], 
    queryFn: () => manufacturingApi.boms().then(r => r.data.data)
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => manufacturingApi.toggleBomStatus(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boms"] }),
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => manufacturingApi.cloneBom(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boms"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => manufacturingApi.deleteBom(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["boms"] }),
  });

  return (
    <div>
      <PageHeader 
        title="Bill of Materials" 
        description="Component trees, operations, and costing" 
        icon={Layers}
        action={{ label: "New BoM", href: "/bom/new" }}
      />
      <div className="space-y-4">
        {(boms || []).map((bom: any) => (
          <Card key={bom.id} className={`overflow-hidden border-l-4 ${bom.isActive ? 'border-l-[var(--primary)]' : 'border-l-[var(--muted)] opacity-75'}`}>
            <div className="flex items-center justify-between p-2 hover:bg-[var(--surface-2)] transition-colors">
              <button onClick={() => setExpanded(expanded === bom.id ? null : bom.id)} className="flex-1 flex items-center gap-3 p-3 text-left">
                {expanded === bom.id ? <ChevronDown className="h-5 w-5 text-[var(--primary)]" /> : <ChevronRight className="h-5 w-5 text-[var(--muted)]" />}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--foreground)]">{bom.name}</p>
                    <span className="text-xs border border-[var(--primary)] text-[var(--primary)] px-2 py-0.5 rounded-full">v{bom.version}</span>
                    {bom.qualityStandard && (
                      <span className="text-xs bg-[var(--primary)] text-white px-2 py-0.5 rounded-full">{bom.qualityStandard}</span>
                    )}
                    {!bom.isActive && <span className="text-xs bg-[var(--surface-2)] text-[var(--muted)] px-2 py-0.5 rounded-full">Inactive</span>}
                  </div>
                  <p className="text-sm text-[var(--muted)]">{bom.finishedProduct?.name}</p>
                </div>
              </button>
              
              <div className="flex items-center gap-4 px-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-[var(--foreground)]">{formatCurrency(Number(bom.totalCost))}</p>
                  <p className="text-xs text-[var(--muted)]">{bom.productionDuration} mins</p>
                </div>
                
                <div className="flex items-center gap-1">
                  <Link href={`/bom/${bom.id}`}>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-[var(--primary)] hover:bg-[var(--surface-2)]">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-[var(--primary)] hover:bg-[var(--surface-2)]" onClick={() => cloneMutation.mutate(bom.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className={`h-8 w-8 ${bom.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`} onClick={() => toggleStatusMutation.mutate({ id: bom.id, isActive: !bom.isActive })}>
                    {bom.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50" onClick={() => { if(confirm("Delete this BoM?")) deleteMutation.mutate(bom.id); }}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {expanded === bom.id && (
              <div className="border-t border-[var(--border)] bg-[var(--background)] p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center text-[var(--foreground)]"><Layers className="h-4 w-4 mr-2 text-[var(--primary)]" /> Components</h4>
                  <div className="space-y-2">
                    {bom.components.map((c: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-[var(--surface)] p-2 rounded-md border border-[var(--border)] text-sm">
                        <span className="font-medium text-[var(--foreground)]">{c.product?.name}</span>
                        <span className="text-[var(--muted)]">{c.quantity} {c.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-3 text-[var(--foreground)]">Routing Operations</h4>
                  <div className="space-y-2">
                    {bom.operations.map((o: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-[var(--surface)] p-2 rounded-md border border-[var(--border)] text-sm">
                        <div>
                          <p className="font-medium text-[var(--foreground)]">{o.sequence}. {o.name}</p>
                          <p className="text-xs text-[var(--muted)]">{o.workCenter?.name}</p>
                        </div>
                        <span className="text-[var(--primary)] font-medium">{o.duration} min</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
        {(!boms || boms.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No Bill of Materials found. Create one to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
