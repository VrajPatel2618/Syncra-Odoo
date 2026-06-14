import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const styles = {
    default: "bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-200",
    success: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    warning: "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    info: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  };
  return (
    <span className={cn("badge-pill", styles[variant], className)} {...props} />
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "default",
    CONFIRMED: "info",
    IN_PROGRESS: "warning",
    COMPLETED: "success",
    FULLY_DELIVERED: "success",
    FULLY_RECEIVED: "success",
    CANCELLED: "danger",
    PENDING: "warning",
    PAID: "success",
  };
  const v = (map[status] || "default") as "default" | "success" | "warning" | "danger" | "info";
  return <Badge variant={v}>{status.replace(/_/g, " ")}</Badge>;
}
