"use client";
import Link from "next/link";

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: { label: string; onClick?: () => void; href?: string };
  breadcrumb?: string;
}

export function PageHeader({ title, description, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-5 pb-4 border-b border-[var(--border)]">
      {breadcrumb && (
        <p className="text-[11px] text-[var(--muted)] mb-1 uppercase tracking-wide">{breadcrumb}</p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
          {description && <p className="text-sm text-[var(--muted)] mt-0.5">{description}</p>}
        </div>
        {action && (
          action.href ? (
            <Link href={action.href}>
              <Button size="sm">{action.label}</Button>
            </Link>
          ) : (
            <Button size="sm" onClick={action.onClick}>{action.label}</Button>
          )
        )}
      </div>
    </div>
  );
}
