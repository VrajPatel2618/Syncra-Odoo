"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

const events = [
  { date: "13 Jun", title: "MO-DEMO001 Production", type: "manufacturing", time: "09:00" },
  { date: "14 Jun", title: "PO Timber Delivery", type: "procurement", time: "14:00" },
  { date: "15 Jun", title: "SO-DEMO001 Delivery", type: "delivery", time: "10:00" },
  { date: "16 Jun", title: "Paint Floor Maintenance", type: "maintenance", time: "08:00" },
  { date: "18 Jun", title: "Batch Production - Beds", type: "manufacturing", time: "09:00" },
];

const typeColors: Record<string, string> = { manufacturing: "info", procurement: "default", delivery: "success", maintenance: "warning" };

export default function CalendarPage() {
  return (
    <div>
      <PageHeader title="Calendar & Scheduler" description="Manufacturing, procurement, and delivery schedules" icon={Calendar} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-center text-xs text-muted py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({length: 35}, (_, i) => (
                <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-sm ${i === 12 ? "bg-indigo-500/20 text-indigo-400 font-bold ring-2 ring-indigo-500/50" : "hover:bg-indigo-500/5 cursor-pointer"}`}>
                  {i > 0 && i <= 30 ? i : ""}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted uppercase">Upcoming Events</h3>
          {events.map((e) => (
            <Card key={e.title} className="p-4"><CardContent className="p-0">
              <div className="flex items-start justify-between"><div><p className="font-medium text-sm">{e.title}</p><p className="text-xs text-muted">{e.date} • {e.time}</p></div>
                <Badge variant={typeColors[e.type] as "info"}>{e.type}</Badge></div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    </div>
  );
}
