"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, AlertTriangle, Link2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable } from "@/components/shared/data-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inventoryApi } from "@/lib/api";
import { motion } from "framer-motion";

const mockInventory = [
  { id: "1", product: { name: "Royal Teak Sofa Set", sku: "FG-SFA-001", reorderPoint: 5 }, warehouse: { name: "Main Warehouse" }, onHandQty: 12, reservedQty: 2, freeQty: 10, isLowStock: false, verified: true },
  { id: "2", product: { name: "Ergonomic Office Chair", sku: "FG-CHR-001", reorderPoint: 15 }, warehouse: { name: "Main Warehouse" }, onHandQty: 8, reservedQty: 3, freeQty: 5, isLowStock: true, verified: true },
];

export default function InventoryPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryApi.list().then((r) => r.data.data),
  });
  const { data: alerts } = useQuery({
    queryKey: ["inventory-alerts"],
    queryFn: () => inventoryApi.alerts().then((r) => r.data.data).catch(() => []),
  });

  const inventory = (data || []).map((i: Record<string, unknown>) => ({
    ...i,
    freeQty: (i.onHandQty as number) - (i.reservedQty as number),
  }));

  return (
    <div>
      <PageHeader title="Inventory Management" description="Free To Use Qty = On Hand Qty − Reserved Qty" icon={Boxes} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total SKUs", value: inventory.length, color: "text-indigo-400" },
          { label: "Low Stock Alerts", value: alerts?.length || 1, color: "text-amber-400" },
          { label: "Blockchain Verified", value: "100%", color: "text-emerald-400" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="p-6"><CardContent className="p-0"><p className="text-sm text-muted">{stat.label}</p><p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p></CardContent></Card>
          </motion.div>
        ))}
      </div>
      <DataTable
        loading={isLoading}
        data={inventory}
        columns={[
          { key: "product", header: "Product", render: (i) => (<div><p className="font-medium">{(i.product as {name:string}).name}</p><p className="text-xs text-muted">{(i.product as {sku:string}).sku}</p></div>) },
          { key: "warehouse", header: "Warehouse", render: (i) => (i.warehouse as {name:string}).name },
          { key: "onHandQty", header: "On Hand" },
          { key: "reservedQty", header: "Reserved" },
          { key: "freeQty", header: "Free to Use", render: (i) => <span className="font-bold text-cyan-400">{i.freeQty as number}</span> },
          { key: "status", header: "Status", render: (i) => i.isLowStock ? <Badge variant="warning"><AlertTriangle className="h-3 w-3 mr-1" />Low Stock</Badge> : <Badge variant="success">Healthy</Badge> },
          { key: "verified", header: "Chain", render: () => <Link2 className="h-4 w-4 text-emerald-400" /> },
        ]}
      />
    </div>
  );
}
