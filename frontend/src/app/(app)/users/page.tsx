"use client";
import { useQuery } from "@tanstack/react-query";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog } from "lucide-react";

export default function UsersPage() {
  const { data } = useQuery({ queryKey: ["users"], queryFn: () => systemApi.users().then(r => r.data.data).catch(() => [
    { firstName: "Rajesh", lastName: "Sharma", email: "admin@shivfurniture.com", role: "SUPER_ADMIN", isActive: true, lastLogin: new Date().toISOString() },
    { firstName: "Priya", lastName: "Patel", email: "manager@shivfurniture.com", role: "MANAGER", isActive: true },
  ])});

  return (
    <div>
      <PageHeader title="User Management" description="User accounts, roles, and access control" icon={UserCog} action={{ label: "+ Add User" }} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data||[]).map((u: {firstName:string; lastName:string; email:string; role:string; isActive?:boolean}) => (
          <Card key={u.email} className="p-6"><CardContent className="p-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">{u.firstName[0]}{u.lastName[0]}</div>
              <div><p className="font-semibold">{u.firstName} {u.lastName}</p><p className="text-xs text-muted">{u.email}</p></div>
            </div>
            <Badge>{u.role.replace(/_/g, " ")}</Badge>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
