"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hexagon, Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const res = await authApi.register({
        email: fd.get("email") as string,
        password: fd.get("password") as string,
        firstName: fd.get("firstName") as string,
        lastName: fd.get("lastName") as string,
        role: "VIEWER",
      });
      setAuth(res.data.data.user, res.data.data.token);
      toast.success("Account created!");
      router.push("/onboarding");
    } catch {
      toast.error("Registration failed. Try demo login instead.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md glass rounded-3xl p-8 gradient-border">
        <div className="flex items-center gap-3 mb-6">
          <Hexagon className="h-8 w-8 text-indigo-400" />
          <div><h1 className="text-xl font-bold gradient-text">Create Account</h1><p className="text-xs text-muted">Join Syncra ERP</p></div>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm mb-1 block">First Name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" /><Input name="firstName" className="pl-10" required /></div></div>
            <div><label className="text-sm mb-1 block">Last Name</label><Input name="lastName" required /></div>
          </div>
          <div><label className="text-sm mb-1 block">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" /><Input name="email" type="email" className="pl-10" required /></div></div>
          <div><label className="text-sm mb-1 block">Password</label><div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" /><Input name="password" type="password" className="pl-10" required /></div></div>
          <Button type="submit" variant="glow" className="w-full">Create Account <ArrowRight className="h-4 w-4" /></Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted">Already have an account? <Link href="/login" className="text-indigo-400">Sign in</Link></p>
      </motion.div>
    </div>
  );
}
