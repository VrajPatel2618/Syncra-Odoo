"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Hexagon, Lock, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "demo-token";
  const [done, setDone] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setDone(true);
    toast.success("Password reset successfully");
  };

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Password Updated</h2>
        <p className="text-muted text-sm mb-6">Your password has been reset. You can now sign in.</p>
        <Button asChild variant="glow"><Link href="/login">Sign In</Link></Button>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold mb-2">Set New Password</h2>
      <p className="text-sm text-muted mb-6">Enter your new password below</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm mb-1 block">New Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input type="password" className="pl-10" required minLength={6} />
          </div>
        </div>
        <div>
          <label className="text-sm mb-1 block">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <Input type="password" className="pl-10" required minLength={6} />
          </div>
        </div>
        <input type="hidden" name="token" value={token} />
        <Button type="submit" variant="glow" className="w-full">Reset Password</Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass rounded-3xl p-8 gradient-border">
        <Hexagon className="h-8 w-8 text-indigo-400 mb-4" />
        <Suspense fallback={<p className="text-muted">Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
        <Link href="/login" className="flex items-center gap-2 text-sm text-muted mt-6 hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </motion.div>
    </div>
  );
}
