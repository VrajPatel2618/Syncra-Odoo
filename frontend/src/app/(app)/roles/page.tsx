"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";

const roles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "SALES", "PURCHASE", "MANUFACTURING", "WAREHOUSE", "FINANCE", "VIEWER"];
const permissions = ["Products", "Inventory", "Sales", "Purchases", "Manufacturing", "Reports", "Users", "Settings"];

export default function RolesPage() {
  return (
    <div>
      <PageHeader title="Roles & Permissions" description="RBAC permission matrix management" icon={Lock} />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-indigo-500/10">
            <th className="px-4 py-3 text-left text-muted">Permission</th>
            {roles.slice(0, 6).map(r => (<th key={r} className="px-3 py-3 text-center text-xs text-muted">{r.replace(/_/g, " ")}</th>))}
          </tr></thead>
          <tbody>
            {permissions.map(p => (
              <tr key={p} className="border-b border-indigo-500/5 hover:bg-indigo-500/5">
                <td className="px-4 py-3 font-medium">{p}</td>
                {roles.slice(0, 6).map(r => (
                  <td key={r} className="px-3 py-3 text-center">
                    <input type="checkbox" defaultChecked={["SUPER_ADMIN", "ADMIN"].includes(r) || (r === "MANAGER" && !["Users", "Settings"].includes(p))} className="rounded accent-indigo-500" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
