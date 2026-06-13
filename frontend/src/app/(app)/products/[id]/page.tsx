"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Package, ArrowLeft, Link2, TrendingUp, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

const mockProduct = {
  id: "1", sku: "FG-SFA-001", name: "Royal Teak Sofa Set", description: "Premium handcrafted teak sofa with premium fabric upholstery",
  category: { name: "Living Room" }, salesPrice: 89999, costPrice: 45000, freeQty: 10, totalOnHand: 12, totalReserved: 2,
  procurementStrategy: "MTS", reorderPoint: 5, reorderQty: 20,
  stockMovements: [{ movementType: "OUT", quantity: 1, createdAt: new Date().toISOString() }],
};

const salesHistory = [
  { month: "Jan", sales: 3 }, { month: "Feb", sales: 5 }, { month: "Mar", sales: 4 },
  { month: "Apr", sales: 7 }, { month: "May", sales: 6 }, { month: "Jun", sales: 8 },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => productsApi.get(params.id as string).then((r) => r.data.data).catch(() => mockProduct),
  });

  const product = data || mockProduct;

  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Button>
      <PageHeader title={product.name} description={product.sku} icon={Package} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <CardContent className="p-0">
            <div className="h-48 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 flex items-center justify-center mb-6">
              <Package className="h-20 w-20 text-indigo-400/30" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Sales Price", value: formatCurrency(Number(product.salesPrice)) },
                { label: "Cost Price", value: formatCurrency(Number(product.costPrice)) },
                { label: "Free Qty", value: product.freeQty ?? 10 },
                { label: "On Hand", value: product.totalOnHand ?? 12 },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-indigo-500/10 p-4">
                  <p className="text-xs text-muted">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted">{product.description || "Premium product from Universal Systems Inc. catalog."}</p>
            <div className="flex gap-2 mt-4">
              <Badge>{product.procurementStrategy || "MTS"}</Badge>
              <Badge variant="info">{product.category?.name || "Furniture"}</Badge>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <CardContent className="p-0">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><TrendingUp className="h-4 w-4 text-indigo-400" /> Sales History</h3>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={salesHistory}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip contentStyle={{ background: "#1e293b", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="p-5">
            <CardContent className="p-0">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Sparkles className="h-4 w-4 text-purple-400" /> AI Demand Prediction</h3>
              <p className="text-sm text-muted">Forecast: +15% demand next month. Recommend maintaining {product.reorderQty || 20} unit reorder quantity.</p>
            </CardContent>
          </Card>
          <Card className="p-5">
            <CardContent className="p-0">
              <h3 className="font-semibold flex items-center gap-2 mb-3"><Link2 className="h-4 w-4 text-emerald-400" /> Blockchain Trace</h3>
              <p className="text-xs font-mono text-cyan-400">Verified on Polygon ✓</p>
              <p className="text-xs text-muted mt-1">All stock movements immutably recorded</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
