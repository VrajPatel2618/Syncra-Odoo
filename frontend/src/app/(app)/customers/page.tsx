"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");

  const { data, isLoading, refetch } = useQuery({ queryKey: ["customers"], queryFn: () => systemApi.customers().then(r => r.data.data).catch(() => [
    { name: "Modern Homes Pvt Ltd", email: "orders@modernhomes.com", city: "Mumbai", creditLimit: 500000 },
    { name: "Elite Interiors", email: "purchase@eliteinteriors.com", city: "Delhi", creditLimit: 300000 },
  ])});

  const handleAdd = async () => {
    if (!name) return;
    try {
      await systemApi.createCustomer({ name, email, city });
      setShowModal(false);
      setName("");
      setEmail("");
      setCity("");
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <PageHeader 
        title="Customer Management" 
        description="CRM profiles, order history, AI insights" 
        icon={Users} 
        action={{ label: "Add Customer", onClick: () => setShowModal(true) }}
      />
      
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-stone-900 border border-stone-700 p-6 rounded-lg w-[400px]">
            <h2 className="text-lg font-bold mb-4 text-white">Add New Customer</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-stone-400 mb-1">Customer Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded p-2 text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded p-2 text-sm text-white" />
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

      <DataTable loading={isLoading} data={data||[]} columns={[
        { key: "name", header: "Customer" }, { key: "email", header: "Email" }, { key: "city", header: "City" },
        { key: "creditLimit", header: "Credit Limit", render: (i) => formatCurrency(i.creditLimit as number) },
      ]} />
    </div>
  );
}
