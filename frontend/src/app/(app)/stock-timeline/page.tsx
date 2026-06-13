"use client";
import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch, Link2 } from "lucide-react";
import { formatDate, truncateHash } from "@/lib/utils";
import { motion } from "framer-motion";

export default function StockTimelinePage() {
  const { data } = useQuery({ queryKey: ["movements"], queryFn: () => inventoryApi.movements().then(r => r.data.data).catch(() => [
    { id: "1", product: { name: "Royal Teak Sofa" }, movementType: "OUT", quantity: 1, previousQty: 13, newQty: 12, blockchainHash: "a1b2c3d4e5f6", createdAt: new Date().toISOString() },
    { id: "2", product: { name: "Teak Wood Plank" }, movementType: "IN", quantity: 200, previousQty: 150, newQty: 350, blockchainHash: "f6e5d4c3b2a1", createdAt: new Date(Date.now()-86400000).toISOString() },
  ])});

  return (
    <div>
      <PageHeader title="Stock Movement Timeline" description="Inventory movement history with blockchain verification" icon={GitBranch} />
      <div className="relative ml-4">
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-indigo-500 to-cyan-500" />
        <div className="space-y-4">
          {(data||[]).map((m: {id:string; product:{name:string}; movementType:string; quantity:number; previousQty:number; newQty:number; blockchainHash:string; createdAt:string}, i: number) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="relative pl-12">
              <div className="absolute left-2 top-4 h-4 w-4 rounded-full bg-indigo-500 border-2 border-[#0a0a0f]" />
              <Card className="p-4"><CardContent className="p-0">
                <div className="flex justify-between items-start"><div><p className="font-medium">{m.product.name}</p><p className="text-sm text-muted">{m.movementType} • {m.quantity} units</p></div>
                  <span className="text-xs text-muted">{formatDate(m.createdAt)}</span></div>
                <p className="text-xs mt-2">{m.previousQty} → {m.newQty}</p>
                {m.blockchainHash && <p className="text-xs font-mono text-cyan-400 mt-1 flex items-center gap-1"><Link2 className="h-3 w-3" />{truncateHash(m.blockchainHash)}</p>}
              </CardContent></Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
