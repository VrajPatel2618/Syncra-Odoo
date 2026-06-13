"use client";
import { useQuery } from "@tanstack/react-query";
import { manufacturingApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Cog } from "lucide-react";

export default function WorkCentersPage() {
  const { data } = useQuery({ queryKey: ["work-centers"], queryFn: () => manufacturingApi.workCenters().then(r => r.data.data).catch(() => [
    { name: "Assembly Line", code: "WC-ASM", type: "Assembly", capacity: 100, utilization: 72 },
    { name: "Paint Floor", code: "WC-PNT", type: "Painting", capacity: 80, utilization: 85 },
    { name: "Packaging Unit", code: "WC-PKG", type: "Packaging", capacity: 120, utilization: 65 },
  ])});

  return (
    <div>
      <PageHeader title="Work Centers" description="Factory floor visualization and utilization" icon={Cog} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(data||[]).map((wc: {name:string; code:string; type:string; capacity:number; utilization:number}) => (
          <Card key={wc.code} className="p-6"><CardContent className="p-0">
            <div className="flex items-center gap-3 mb-4"><Cog className="h-8 w-8 text-indigo-400" /><div><p className="font-bold">{wc.name}</p><p className="text-xs text-muted">{wc.code} • {wc.type}</p></div></div>
            <div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted">Utilization</span><span className={wc.utilization > 80 ? "text-amber-400" : "text-emerald-400"}>{wc.utilization}%</span></div>
              <div className="h-3 rounded-full bg-indigo-500/20"><div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" style={{ width: `${wc.utilization}%` }} /></div>
              <p className="text-xs text-muted">Capacity: {wc.capacity} units/day</p></div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
