"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Hexagon, Sparkles, Link2, Package, Factory, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  { title: "Welcome to Syncra", desc: "Your intelligent manufacturing ERP", icon: Hexagon, content: "Transform Universal Systems Inc. into a centralized digital ecosystem powered by AI and blockchain." },
  { title: "AI Intelligence", desc: "Predictive analytics at your fingertips", icon: Sparkles, content: "Forecast inventory, detect delays, optimize procurement, and get operational summaries from AI Copilot." },
  { title: "Blockchain Traceability", desc: "Immutable audit for every movement", icon: Link2, content: "Every stock movement, delivery, and manufacturing completion is verified on Polygon blockchain." },
  { title: "Inventory Core", desc: "Everything revolves around stock", icon: Package, content: "Sales decrease stock. Purchases increase stock. Manufacturing consumes and produces. All connected." },
  { title: "Smart Manufacturing", desc: "Digital factory operations", icon: Factory, content: "BoM, work orders, work centers, and production scheduling — all in one command center." },
  { title: "Ready to Launch", desc: "Your ERP is configured", icon: Check, content: "Company setup complete. Warehouse configured. Initial inventory loaded. AI assistant ready." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-8">
      <div className="w-full max-w-2xl">
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? "w-8 bg-indigo-500" : "w-4 bg-indigo-500/20"}`} />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="glass rounded-3xl p-10 text-center gradient-border">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 mx-auto mb-6">
              <Icon className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold font-[family-name:var(--font-poppins)] mb-2">{current.title}</h2>
            <p className="text-indigo-400 mb-4">{current.desc}</p>
            <p className="text-muted max-w-md mx-auto mb-8">{current.content}</p>
            <div className="flex justify-center gap-3">
              {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}
              {step < steps.length - 1 ? (
                <Button variant="glow" onClick={() => setStep(step + 1)}>Continue <ArrowRight className="h-4 w-4" /></Button>
              ) : (
                <Button variant="glow" onClick={() => router.push("/dashboard")}>Launch Syncra ERP <ArrowRight className="h-4 w-4" /></Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
