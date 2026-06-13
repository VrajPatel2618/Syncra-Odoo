"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns, data, loading, emptyMessage = "No records found.",
}: DataTableProps<T>) {
  if (loading) return <TableSkeleton />;

  if (!data.length) {
    return (
      <Card className="p-10 text-center text-sm text-[var(--muted)]">
        {emptyMessage}
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-head">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-2.5 text-left">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-[var(--surface)]" : "bg-[var(--background)]"}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-2.5 border-t border-[var(--border)]">
                    {col.render ? col.render(item) : String(item[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export { StatusBadge };
