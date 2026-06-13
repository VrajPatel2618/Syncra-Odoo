"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { salesApi, systemApi, productsApi } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const mockSales = [
  { id: "1", orderNumber: "SO-DEMO001", customer: { name: "Modern Homes Pvt Ltd" }, status: "CONFIRMED", totalAmount: 106198, orderDate: new Date().toISOString(), deliveryDate: new Date(Date.now() + 7*86400000).toISOString() },
  { id: "2", orderNumber: "SO-DEMO002", customer: { name: "Elite Interiors" }, status: "DRAFT", totalAmount: 54999, orderDate: new Date().toISOString() },
];

const columns = [
  { status: "DRAFT", label: "Draft", color: "border-slate-500/30" },
  { status: "CONFIRMED", label: "Confirmed", color: "border-blue-500/30" },
  { status: "PARTIALLY_DELIVERED", label: "Partial", color: "border-amber-500/30" },
  { status: "FULLY_DELIVERED", label: "Delivered", color: "border-emerald-500/30" },
];

export default function SalesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: () => salesApi.list().then((r) => r.data.data).catch(() => mockSales),
  });

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: () => systemApi.customers().then(r => r.data.data)
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list().then(r => r.data.data)
  });

  const createOrder = useMutation({
    mutationFn: async () => {
      if (!customerId || !productId) throw new Error("Please select a customer and product.");
      const selectedProduct = products?.find((p: any) => p.id === productId);
      if (!selectedProduct) throw new Error("Product not found");
      
      const payload = {
        customerId,
        items: [{ productId, quantity, unitPrice: Number(selectedProduct.sellingPrice || selectedProduct.basePrice || 0) }]
      };
      return salesApi.create(payload);
    },
    onSuccess: () => {
      toast.success("Sales Order created successfully");
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to create order"),
  });

  const orders = data || mockSales;

  return (
    <div>
      <PageHeader 
        title="Sales Management" 
        description="Order lifecycle: Draft → Confirmed → Delivered" 
        icon={ShoppingCart} 
        action={{ label: "+ New Order", onClick: () => setShowModal(true) }} 
      />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-stone-900 border border-stone-700 p-6 rounded-xl w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6">Create New Sales Order</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">Customer</label>
                <select 
                  className="w-full bg-stone-800 border border-stone-700 rounded-md p-2 text-white text-sm outline-none"
                  value={customerId} onChange={(e) => setCustomerId(e.target.value)}
                >
                  <option value="">Select Customer...</option>
                  {customers?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">Product</label>
                <select 
                  className="w-full bg-stone-800 border border-stone-700 rounded-md p-2 text-white text-sm outline-none"
                  value={productId} onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Select Product...</option>
                  {products?.map((p: any) => <option key={p.id} value={p.id}>{p.name} - {formatCurrency(Number(p.sellingPrice || p.basePrice))}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase mb-1">Quantity</label>
                <input 
                  type="number" min="1"
                  className="w-full bg-stone-800 border border-stone-700 rounded-md p-2 text-white text-sm outline-none"
                  value={quantity} onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => createOrder.mutate()} disabled={createOrder.isPending}>
                {createOrder.isPending ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {columns.map((col) => (
          <Card key={col.status} className={`p-4 border-t-2 ${col.color}`}>
            <CardContent className="p-0">
              <p className="text-xs text-muted mb-2">{col.label}</p>
              <div className="space-y-2">
                {orders.filter((o: {status:string}) => o.status === col.status).map((o: typeof mockSales[0]) => (
                  <div key={o.id} className="rounded-lg glass p-3 text-sm">
                    <p className="font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-muted">{o.customer?.name}</p>
                    <p className="text-xs text-indigo-400 mt-1">{formatCurrency(o.totalAmount)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <DataTable loading={isLoading} data={orders} columns={[
        { key: "orderNumber", header: "Order #" },
        { key: "customer", header: "Customer", render: (o: any) => o.customer?.name },
        { key: "status", header: "Status", render: (o: any) => <StatusBadge status={o.status as string} /> },
        { key: "totalAmount", header: "Total", render: (o: any) => formatCurrency(o.totalAmount as number) },
        { key: "orderDate", header: "Date", render: (o: any) => formatDate(o.orderDate as string) },
        { key: "deliveryDate", header: "Delivery", render: (o: any) => o.deliveryDate ? formatDate(o.deliveryDate as string) : "—" },
        { key: "actions", header: "Actions", render: (o: any) => {
          const handleAction = (promise: Promise<any>, successMsg: string) => {
            toast.promise(promise, {
              loading: 'Processing...',
              success: () => {
                queryClient.invalidateQueries({ queryKey: ["sales"] });
                return successMsg;
              },
              error: (err: any) => err?.response?.data?.message || err?.response?.data?.error || err.message || "Action failed"
            });
          };
          return (
            <div className="flex gap-2">
              {o.status === "DRAFT" && (
                <button className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded" onClick={() => handleAction(salesApi.confirm(o.id as string), "Order confirmed")}>Confirm</button>
              )}
              {(o.status === "CONFIRMED" || o.status === "PARTIALLY_DELIVERED") && (
                <button className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-2 py-1 rounded" onClick={() => handleAction(salesApi.deliver(o.id as string), "Order delivered")}>Deliver</button>
              )}
              {o.status !== "DRAFT" && (
                <>
                  <button className="text-xs bg-cyan-500 hover:bg-cyan-600 text-white px-2 py-1 rounded" onClick={() => handleAction(salesApi.invoice(o.id as string), "Invoice generated")}>Invoice</button>
                  <button className="text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded" onClick={() => handleAction(salesApi.pay(o.id as string), "Payment recorded")}>Pay</button>
                </>
              )}
            </div>
          );
        }},
      ]} />
    </div>
  );
}
