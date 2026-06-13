"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Hexagon, Smartphone, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [useApp, setUseApp] = useState(true);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      toast.error("Enter your 6-digit authentication code");
      return;
    }
    toast.success("Two-factor authentication verified");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass rounded-3xl p-8 gradient-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <Hexagon className="h-5 w-5 text-indigo-400 mb-1" />
            <h2 className="text-xl font-bold">Two-Factor Authentication</h2>
            <p className="text-xs text-muted">Extra security for your account</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button onClick={() => setUseApp(true)} className={`flex-1 rounded-xl py-2 text-sm ${useApp ? "bg-indigo-500/20 text-indigo-300" : "text-muted"}`}>
            Authenticator App
          </button>
          <button onClick={() => setUseApp(false)} className={`flex-1 rounded-xl py-2 text-sm ${!useApp ? "bg-indigo-500/20 text-indigo-300" : "text-muted"}`}>
            SMS Code
          </button>
        </div>

        {useApp ? (
          <div className="rounded-xl bg-indigo-500/10 p-4 mb-6 flex items-center gap-3">
            <Smartphone className="h-8 w-8 text-indigo-400" />
            <p className="text-sm text-muted">Open your authenticator app and enter the 6-digit code for Syncra ERP</p>
          </div>
        ) : (
          <p className="text-sm text-muted mb-6">A verification code was sent to your registered phone number.</p>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="text-center text-2xl tracking-[0.5em] font-mono"
            maxLength={6}
          />
          <Button type="submit" variant="glow" className="w-full">Verify & Continue</Button>
        </form>

        <Link href="/login" className="flex items-center gap-2 text-sm text-muted mt-6 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Use a different account
        </Link>
      </motion.div>
    </div>
  );
}
