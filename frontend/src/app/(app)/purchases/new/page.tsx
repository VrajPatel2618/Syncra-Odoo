"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { purchaseApi, systemApi, productsApi } from "@/lib/api";

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: 1, unitPrice: 0 }]);

  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => systemApi.vendors().then((r) => r.data.data).catch(() => []),
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list().then((r) => r.data.data).catch(() => []),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId || items.some(i => !i.productId || i.quantity < 1)) {
      alert("Please fill all required fields correctly.");
      return;
    }
    try {
      setLoading(true);
      await purchaseApi.create({ vendorId, expectedDate, notes, items });
      router.push("/purchases");
    } catch (error) {
      console.error("Failed to create PO", error);
      alert("Failed to create Purchase Order. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => setItems([...items, { productId: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    
    // Auto-fill price if product changes
    if (field === 'productId') {
      const selected = products?.find((p: any) => p.id === value);
      if (selected) {
        newItems[index].unitPrice = Number(selected.costPrice);
      }
    }
    
    setItems(newItems);
  };

  const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back to Purchases
      </Button>
      <PageHeader title="Create Purchase Order" description="Order raw materials or products from vendors" />

      <Card className="max-w-4xl">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Vendor</label>
                <select
                  required
                  className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                >
                  <option value="">Select Vendor</option>
                  {vendors?.map((v: any) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Expected Date</label>
                <input
                  type="date"
                  className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-[var(--muted)]">Order Items</label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" /> Add Item
                </Button>
              </div>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1">
                      <select
                        required
                        className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      >
                        <option value="">Select Product</option>
                        {products?.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        required
                        className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                      />
                    </div>
                    <div className="w-32">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                      />
                    </div>
                    {items.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} className="text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="text-right text-lg font-bold">
              Subtotal: ₹{total.toFixed(2)}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--muted)]">Notes</label>
              <textarea
                className="w-full p-2 bg-[var(--surface)] border border-[var(--border)] rounded"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Save className="h-4 w-4 mr-2" /> {loading ? "Creating..." : "Create Purchase Order"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
