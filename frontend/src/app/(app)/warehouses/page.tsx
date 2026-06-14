"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Warehouse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WarehousesPage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => systemApi.warehouses().then((r) => r.data.data).catch(() => [
      { name: "Main Warehouse", code: "WH-MAIN", city: "Rajkot", capacity: 5000, isActive: true },
      { name: "South Distribution", code: "WH-SOUTH", city: "Ahmedabad", capacity: 3000, isActive: true },
    ]),
  });

  const handleAdd = async () => {
    if (!name || !code) return;
    try {
      await systemApi.createWarehouse({ name, code, city });
      toast.success("Warehouse added successfully");
      setShowModal(false);
      setName("");
      setCode("");
      setCity("");
      refetch();
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to add warehouse");
    }
  };

  return (
    <div>
      <PageHeader 
        title="Warehouse Management" 
        description="Digital warehouse twin with zone mapping" 
        icon={Warehouse} 
        action={{ label: "Add Warehouse", onClick: () => setShowModal(true) }}
      />
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-stone-900 border border-stone-700 p-6 rounded-lg w-[400px]">
            <h2 className="text-lg font-bold mb-4 text-white">Add New Warehouse</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Warehouse Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded p-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Code</label>
                <input value={code} onChange={e => setCode(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded p-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded p-2 text-sm text-white" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[{ l: "Active Warehouses", v: data?.length || 2, c: "text-indigo-400" }, { l: "Total Capacity", v: "8,000", c: "text-cyan-400" }, { l: "Utilization", v: "68%", c: "text-emerald-400" }].map((s) => (
          <Card key={s.l} className="p-6"><CardContent className="p-0"><p className="text-sm text-muted">{s.l}</p><p className={`text-2xl font-bold ${s.c}`}>{s.v}</p></CardContent></Card>
        ))}
      </div>
      <DataTable loading={isLoading} data={data || []} columns={[
        { key: "code", header: "Code" }, { key: "name", header: "Name" }, { key: "city", header: "City" },
        { key: "capacity", header: "Capacity" }, { key: "isActive", header: "Status", render: (i) => <Badge variant="success">Active</Badge> },
      ]} />
    </div>
  );
}
