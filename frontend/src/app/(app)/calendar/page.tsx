"use client";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { manufacturingApi, purchaseApi, salesApi } from "@/lib/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

const typeColors: Record<string, string> = { manufacturing: "info", procurement: "default", delivery: "success", maintenance: "warning" };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const { data: manufacturingOrders } = useQuery({ queryKey: ["manufacturing-orders"], queryFn: () => manufacturingApi.orders().then(r => r.data.data) });
  const { data: purchases } = useQuery({ queryKey: ["purchases"], queryFn: () => purchaseApi.list().then(r => r.data.data) });
  const { data: sales } = useQuery({ queryKey: ["sales"], queryFn: () => salesApi.list().then(r => r.data.data) });

  const mappedEvents: any[] = [];
  if (manufacturingOrders) {
    manufacturingOrders.forEach((o: any) => {
      if (o.scheduledDate) mappedEvents.push({ date: parseISO(o.scheduledDate), title: o.orderNumber + " Production", type: "manufacturing", time: format(parseISO(o.scheduledDate), "HH:mm") });
    });
  }
  if (purchases) {
    purchases.forEach((p: any) => {
      if (p.expectedDate) mappedEvents.push({ date: parseISO(p.expectedDate), title: p.orderNumber + " " + (p.vendor?.name || 'Vendor') + " Delivery", type: "procurement", time: format(parseISO(p.expectedDate), "HH:mm") });
    });
  }
  if (sales) {
    sales.forEach((s: any) => {
      if (s.deliveryDate) mappedEvents.push({ date: parseISO(s.deliveryDate), title: s.orderNumber + " Delivery", type: "delivery", time: format(parseISO(s.deliveryDate), "HH:mm") });
    });
  }

  mappedEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);

  const upcomingEvents = mappedEvents.filter(e => e.date.getTime() >= new Date().setHours(0,0,0,0)).slice(0, 8);

  return (
    <div>
      <PageHeader title="Calendar & Scheduler" description="Manufacturing, procurement, and delivery schedules" icon={Calendar} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{format(currentDate, "MMMM yyyy")}</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 mb-2">
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
                <div key={d} className="text-center text-xs font-semibold text-muted py-2">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({length: startDayOfWeek}).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {days.map((day, i) => {
                const dayEvents = mappedEvents.filter(e => isSameDay(e.date, day));
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={i} className={spect-square rounded-lg flex flex-col p-1.5 border }>
                    <span className={	ext-xs }>{format(day, "d")}</span>
                    <div className="mt-1 space-y-1 overflow-y-auto scrollbar-none">
                      {dayEvents.slice(0, 3).map((e, j) => (
                        <div key={j} className="text-[9px] truncate px-1 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700" title={e.title}>
                          {e.time} {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <div className="text-[9px] text-center text-stone-500">+{dayEvents.length - 3} more</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted uppercase">Upcoming Events</h3>
          {upcomingEvents.length === 0 && <p className="text-sm text-stone-500">No upcoming events.</p>}
          {upcomingEvents.map((e, i) => (
            <Card key={i} className="p-4"><CardContent className="p-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-medium text-sm truncate" title={e.title}>{e.title}</p>
                  <p className="text-xs text-muted">{format(e.date, "dd MMM yyyy")} • {e.time}</p>
                </div>
                <Badge variant={typeColors[e.type] as any}>{e.type}</Badge>
              </div>
            </CardContent></Card>
          ))}
        </div>
      </div>
    </div>
  );
}
