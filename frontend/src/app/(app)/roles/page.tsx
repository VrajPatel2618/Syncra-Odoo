"use client";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { PERMISSION_MATRIX, RoleType, ModuleType } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";

const roles = Object.keys(PERMISSION_MATRIX) as RoleType[];
const modules: ModuleType[] = ['dashboard', 'inventory', 'sales', 'purchase', 'manufacturing', 'audit_log', 'user_management', 'blockchain'];

const getBadgeVariant = (level: string) => {
  if (level === 'full') return 'default';
  if (level === 'read' || level === 'limited') return 'secondary';
  if (level === 'own') return 'outline';
  return 'destructive';
};

export default function RolesPage() {
  return (
    <div>
      <PageHeader title="Roles & Permissions" description="RBAC permission matrix management" icon={Lock} />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className="px-4 py-3 text-left text-[var(--muted)]">Module</th>
              {roles.map(r => (
                <th key={r} className="px-3 py-3 text-center text-xs text-[var(--muted)] whitespace-nowrap">
                  {r.replace(/_/g, " ")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map(mod => (
              <tr key={mod} className="border-b border-[var(--border)] hover:bg-[var(--foreground)]/5 transition-colors">
                <td className="px-4 py-3 font-medium capitalize whitespace-nowrap">
                  {mod.replace(/_/g, " ")}
                </td>
                {roles.map(r => {
                  const level = PERMISSION_MATRIX[r][mod];
                  return (
                    <td key={r} className="px-3 py-3 text-center">
                      <Badge variant={getBadgeVariant(level) as any} className="uppercase text-[10px]">
                        {level}
                      </Badge>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
