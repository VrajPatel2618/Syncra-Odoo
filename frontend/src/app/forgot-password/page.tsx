"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Hexagon, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass rounded-3xl p-8 gradient-border">
        <Hexagon className="h-8 w-8 text-indigo-400 mb-4" />
        <h1 className="text-xl font-bold mb-2">Reset Password</h1>
        <p className="text-sm text-muted mb-6">Enter your email to receive a reset link</p>
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Reset link sent (demo)"); }} className="space-y-4">
          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" /><Input type="email" placeholder="Email address" className="pl-10" required /></div>
          <Button type="submit" variant="glow" className="w-full">Send Reset Link</Button>
        </form>
        <Link href="/login" className="flex items-center gap-2 text-sm text-muted mt-6 hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
      </motion.div>
    </div>
  );
}
