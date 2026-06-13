"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VendorsPage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const { data, isLoading, refetch } = useQuery({ queryKey: ["vendors"], queryFn: () => systemApi.vendors().then(r => r.data.data).catch(() => [
    { name: "Gujarat Timber Suppliers", email: "sales@gujtimber.com", rating: 4.8, leadTimeDays: 5 },
    { name: "Premium Fabrics India", email: "orders@premiumfabrics.com", rating: 4.5, leadTimeDays: 7 },
  ])});

  const handleAdd = async () => {
    if (!name) return;
    try {
      await systemApi.createVendor({ name, email });
      setShowModal(false);
      setName("");
      setEmail("");
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Vendor Management" 
        description="Vendor scorecards and procurement analytics" 
        icon={Building2} 
        action={{ label: "Add Vendor", onClick: () => setShowModal(true) }}
      />
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-stone-900 border border-stone-700 p-6 rounded-lg w-[400px]">
            <h2 className="text-lg font-bold mb-4 text-white">Add New Vendor</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Vendor Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded p-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded p-2 text-sm text-white" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Save</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DataTable loading={isLoading} data={data||[]} columns={[
        { key: "name", header: "Vendor" }, { key: "email", header: "Email" },
        { key: "rating", header: "Rating", render: (i) => `⭐ ${i.rating}` }, { key: "leadTimeDays", header: "Lead Time (days)" },
      ]} />
    </div>
  );
}
