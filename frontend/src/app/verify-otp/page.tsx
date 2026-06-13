"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Hexagon, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Enter the full 6-digit code");
      return;
    }
    toast.success("OTP verified");
    router.push("/role-selection");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass rounded-3xl p-8 gradient-border text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/20 mx-auto mb-4">
          <ShieldCheck className="h-8 w-8 text-indigo-400" />
        </div>
        <Hexagon className="h-6 w-6 text-indigo-400 mx-auto mb-2" />
        <h2 className="text-xl font-bold mb-2">Verify OTP</h2>
        <p className="text-sm text-muted mb-8">Enter the 6-digit code sent to your email</p>
        <div className="flex justify-center gap-2 mb-8">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => e.key === "Backspace" && !digit && i > 0 && inputs.current[i - 1]?.focus()}
              className="h-12 w-10 rounded-xl glass text-center text-lg font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none"
            />
          ))}
        </div>
        <Button variant="glow" className="w-full mb-4" onClick={handleVerify}>Verify Code</Button>
        <p className="text-xs text-muted">Demo code: any 6 digits</p>
        <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted mt-6 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </motion.div>
    </div>
  );
}
