import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number) {
  return new Intl.NumberFormat("en-IN").format(num);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

/** Deterministic values for animated particles — avoids SSR/client Math.random() mismatch */
export function particlePosition(index: number, seed = 37) {
  return {
    left: `${((index * seed + 13) % 97) + 1}%`,
    top: `${((index * seed + 29) % 93) + 2}%`,
    duration: 2 + (index % 5) * 0.4,
    delay: (index % 7) * 0.25,
  };
}

export function truncateHash(hash: string, start = 6, end = 4) {
  if (hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

export const statusColors: Record<string, string> = {
  DRAFT: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  CONFIRMED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PARTIALLY_DELIVERED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  FULLY_DELIVERED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PARTIALLY_RECEIVED: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  FULLY_RECEIVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  IN_PROGRESS: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  COMPLETED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  PLANNED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
  PENDING: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};
