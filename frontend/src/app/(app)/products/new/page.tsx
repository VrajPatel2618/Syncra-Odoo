"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { productsApi } from "@/lib/api";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    categoryId: "",
    salesPrice: 0,
    costPrice: 0,
    procurementStrategy: "MTS",
    reorderPoint: 10,
    reorderQty: 50,
  });

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => productsApi.categories().then((r) => r.data.data).catch(() => []),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await productsApi.create(formData);
      router.push("/products");
    } catch (error) {
      console.error("Failed to create product", error);
      alert("Failed to create product. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
      </Button>
      <PageHeader title="Add New Product" description="Create a new product or raw material" />

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Product Name</label>
              <input
                required
                type="text"
                className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Description</label>
              <textarea
                className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Category</label>
                <select
                  required
                  className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Strategy</label>
                <select
                  className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                  value={formData.procurementStrategy}
                  onChange={(e) => setFormData({ ...formData, procurementStrategy: e.target.value })}
                >
                  <option value="MTS">Make To Stock (MTS)</option>
                  <option value="MTO">Make To Order (MTO)</option>
                  <option value="JIT">Just In Time (JIT)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Cost Price</label>
                <input
                  type="number"
                  required
                  className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Sales Price</label>
                <input
                  type="number"
                  required
                  className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                  value={formData.salesPrice}
                  onChange={(e) => setFormData({ ...formData, salesPrice: Number(e.target.value) })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={loading}>
              <Save className="h-4 w-4 mr-2" /> {loading ? "Saving..." : "Save Product"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
