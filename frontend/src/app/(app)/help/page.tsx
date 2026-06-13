"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HelpCircle, Book, MessageCircle, Search } from "lucide-react";

const faqs = [
  { q: "How does inventory reservation work?", a: "When a sales order is confirmed, stock is reserved. Free Qty = On Hand - Reserved." },
  { q: "What triggers procurement automation?", a: "When free quantity falls below reorder point, the system suggests MO (MTS) or PO." },
  { q: "How is blockchain used?", a: "Blockchain stores immutable hashes for stock movements, deliveries, and audit logs." },
  { q: "How do I use AI Copilot?", a: "Press the sparkle icon or visit AI Chat. Ask about stock, orders, or manufacturing." },
];

export default function HelpPage() {
  return (
    <div>
      <PageHeader title="Help & Support" description="Documentation, tutorials, and AI help" icon={HelpCircle} />
      <div className="relative mb-6"><Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" /><Input placeholder="Search knowledge base..." className="pl-10" /></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[{ icon: Book, title: "Documentation", desc: "Complete ERP guide" }, { icon: MessageCircle, title: "AI Help", desc: "Ask Syncra AI" }, { icon: HelpCircle, title: "Support Ticket", desc: "Contact support" }].map((item) => (
          <Card key={item.title} className="p-6 cursor-pointer hover:border-indigo-500/30 transition-all"><CardContent className="p-0 text-center">
            <item.icon className="h-8 w-8 text-indigo-400 mx-auto mb-3" /><h3 className="font-semibold">{item.title}</h3><p className="text-sm text-muted">{item.desc}</p>
          </CardContent></Card>
        ))}
      </div>
      <h3 className="font-semibold mb-4">FAQs</h3>
      <div className="space-y-3">{faqs.map((f) => (
        <Card key={f.q} className="p-5"><CardContent className="p-0"><p className="font-medium mb-2">{f.q}</p><p className="text-sm text-muted">{f.a}</p></CardContent></Card>
      ))}</div>
    </div>
  );
}
