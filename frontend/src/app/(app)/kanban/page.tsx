"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Kanban } from "lucide-react";

const columns = [
  { title: "Draft", items: [{ id: "1", title: "SO-0042", subtitle: "Modern Homes" }] },
  { title: "In Progress", items: [{ id: "2", title: "MO-DEMO001", subtitle: "Sofa Production" }, { id: "3", title: "PO-DEMO001", subtitle: "Timber Order" }] },
  { title: "Review", items: [{ id: "4", title: "DEL-001", subtitle: "Mumbai Delivery" }] },
  { title: "Complete", items: [{ id: "5", title: "SO-DEMO001", subtitle: "Delivered" }] },
];

export default function KanbanPage() {
  return (
    <div>
      <PageHeader title="Kanban Workflow" description="Drag-and-drop workflow boards" icon={Kanban} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => (
          <div key={col.title} className="space-y-3">
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wider px-2">{col.title} ({col.items.length})</h3>
            {col.items.map((item) => (
              <Card key={item.id} className="p-4 cursor-grab hover:border-indigo-500/30 transition-all">
                <CardContent className="p-0"><p className="font-medium text-sm">{item.title}</p><p className="text-xs text-muted">{item.subtitle}</p></CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
