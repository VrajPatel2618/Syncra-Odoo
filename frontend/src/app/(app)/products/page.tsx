"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Package, Grid3X3, List } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, StatusBadge } from "@/components/shared/data-table";
import { Badge } from "@/components/ui/badge";
import { productsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useState } from "react";

const mockProducts = [
  { id: "1", sku: "FG-SFA-001", name: "Royal Teak Sofa Set", category: { name: "Living Room" }, salesPrice: 89999, costPrice: 45000, freeQty: 12, procurementStrategy: "MTS" },
  { id: "2", sku: "FG-BED-001", name: "King Size Bed Frame", category: { name: "Bedroom" }, salesPrice: 54999, costPrice: 28000, freeQty: 8, procurementStrategy: "MTS" },
  { id: "3", sku: "FG-DESK-001", name: "Executive Office Desk", category: { name: "Office" }, salesPrice: 35999, costPrice: 18000, freeQty: 15, procurementStrategy: "MTO" },
];

export default function ProductsPage() {
  const [view, setView] = useState<"grid" | "table">("table");
  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: () => productsApi.list().then((r) => r.data.data),
  });

  const products = data || [];

  return (
    <div>
      <PageHeader
        title="Product Catalog"
        description="SKUs, pricing & procurement rules"
        breadcrumb="Inventory / Products"
        action={{ label: "+ Add Product", href: "/products/new" }}
      />

      <div className="flex gap-1 mb-4">
        <button onClick={() => setView("table")} className={`p-2 rounded border ${view === "table" ? "border-[var(--primary)] bg-[var(--surface)]" : "border-transparent"}`}>
          <List className="h-4 w-4" />
        </button>
        <button onClick={() => setView("grid")} className={`p-2 rounded border ${view === "grid" ? "border-[var(--primary)] bg-[var(--surface)]" : "border-transparent"}`}>
          <Grid3X3 className="h-4 w-4" />
        </button>
      </div>

      {view === "table" ? (
        <DataTable
          loading={isLoading}
          data={products}
          columns={[
            { key: "sku", header: "SKU", render: (p) => <Link href={`/products/${p.id}`} className="text-[var(--primary)] font-semibold hover:underline">{String(p.sku)}</Link> },
            { key: "name", header: "Name" },
            { key: "category", header: "Category", render: (p) => (p.category as { name: string })?.name },
            { key: "salesPrice", header: "Sell Price", render: (p) => formatCurrency(p.salesPrice as number) },
            { key: "freeQty", header: "Free Qty" },
            { key: "procurementStrategy", header: "Strategy", render: (p) => <Badge>{String(p.procurementStrategy)}</Badge> },
          ]}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {products.map((p: typeof mockProducts[0]) => (
            <Link key={p.id} href={`/products/${p.id}`} className="panel p-4 hover:border-[var(--primary)] transition-colors">
              <div className="flex items-start justify-between mb-2">
                <Package className="h-5 w-5 text-[var(--muted)]" />
                <Badge>{p.procurementStrategy}</Badge>
              </div>
              <p className="font-bold text-sm">{p.name}</p>
              <p className="text-xs text-[var(--muted)]">{p.sku}</p>
              <div className="flex justify-between mt-3 text-sm">
                <span className="font-semibold">{formatCurrency(p.salesPrice)}</span>
                <span className="text-[var(--muted)]">Free: {p.freeQty}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
