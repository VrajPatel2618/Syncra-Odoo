"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { useAuthStore } from "@/lib/stores";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      <PageHeader title="Profile" description="Your account and activity" icon={User} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 text-center"><CardContent className="p-0">
          <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
          <p className="text-muted text-sm">{user?.email}</p>
          <Badge className="mt-3">{user?.role?.replace(/_/g, " ")}</Badge>
        </CardContent></Card>
        <Card className="lg:col-span-2 p-6"><CardContent className="p-0">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {["Confirmed Sales Order SO-DEMO001", "Reviewed inventory alerts", "Generated procurement report"].map((a, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-indigo-500/5 text-sm"><div className="h-2 w-2 rounded-full bg-indigo-400" />{a}</div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
