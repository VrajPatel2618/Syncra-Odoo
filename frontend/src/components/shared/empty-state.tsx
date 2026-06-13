"use client";

import { LucideIcon, RefreshCw, WifiOff, Link2Off, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick?: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 mb-6">
        <Icon className="h-10 w-10 text-indigo-400/50" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted max-w-sm mb-6">{description}</p>
      {action && (
        <Button variant="glow" onClick={action.onClick}>{action.label}</Button>
      )}
    </motion.div>
  );
}

export function ErrorState({ type = "network", onRetry }: { type?: "network" | "blockchain" | "ai"; onRetry?: () => void }) {
  const config = {
    network: { icon: WifiOff, title: "Connection Lost", desc: "Unable to reach Syncra servers. Check your connection and retry." },
    blockchain: { icon: Link2Off, title: "Blockchain Sync Failed", desc: "Audit layer temporarily unavailable. Operations continue with local hashing." },
    ai: { icon: Bot, title: "AI Unavailable", desc: "AI Copilot is offline. Mock intelligence mode is active." },
  }[type];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass rounded-2xl p-8 text-center border border-red-500/20"
    >
      <config.icon className="h-12 w-12 text-red-400 mx-auto mb-4" />
      <h3 className="font-semibold mb-2">{config.title}</h3>
      <p className="text-sm text-muted mb-4">{config.desc}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      )}
    </motion.div>
  );
}
