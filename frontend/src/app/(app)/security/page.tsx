"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Monitor, Smartphone } from "lucide-react";

export default function SecurityPage() {
  return (
    <div>
      <PageHeader title="Security Center" description="Login history, sessions, and 2FA controls" icon={ShieldCheck} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6"><CardContent className="p-0"><p className="text-sm text-muted">Active Sessions</p><p className="text-2xl font-bold text-emerald-400">2</p></CardContent></Card>
        <Card className="p-6"><CardContent className="p-0"><p className="text-sm text-muted">Failed Logins (24h)</p><p className="text-2xl font-bold text-emerald-400">0</p></CardContent></Card>
        <Card className="p-6"><CardContent className="p-0"><p className="text-sm text-muted">2FA Status</p><Badge variant="warning" className="mt-1">Recommended</Badge></CardContent></Card>
      </div>
      <h3 className="font-semibold mb-3">Active Devices</h3>
      <div className="space-y-3">
        <Card className="p-4"><CardContent className="p-0 flex items-center justify-between">
          <div className="flex items-center gap-3"><Monitor className="h-5 w-5 text-indigo-400" /><div><p className="text-sm font-medium">Windows Desktop</p><p className="text-xs text-muted">Rajkot, Gujarat • Current session</p></div></div>
          <Badge variant="success">Active</Badge>
        </CardContent></Card>
        <Card className="p-4"><CardContent className="p-0 flex items-center justify-between">
          <div className="flex items-center gap-3"><Smartphone className="h-5 w-5 text-cyan-400" /><div><p className="text-sm font-medium">Mobile Device</p><p className="text-xs text-muted">Ahmedabad • 2 hours ago</p></div></div>
          <Badge variant="info">Recent</Badge>
        </CardContent></Card>
      </div>
    </div>
  );
}
