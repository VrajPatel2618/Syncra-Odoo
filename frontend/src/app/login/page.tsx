"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("admin@universal.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      setAuth(res.data.data.user, res.data.data.token);
      toast.success("Logged in");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      toast.error("Could not sign in. Please confirm the backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-2/5 sidebar-bg flex-col justify-between p-8">
        <div>
          <div className="h-10 w-10 rounded bg-[var(--primary)] text-white font-black flex items-center justify-center text-sm mb-6">SE</div>
          <h1 className="brand-serif text-2xl text-white mb-2">Universal Systems Inc.</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Internal ERP for managing production, inventory, purchase orders, manufacturing, and deliveries from one central hub.
          </p>
        </div>
        <div className="text-xs text-stone-500 space-y-1 border-t border-stone-700 pt-4">
          <p>Industrial Area, Rajkot</p>
          <p>3 work centers - 2 warehouses</p>
          <p>Syncra ERP v1.0 - Hackathon build</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="w-full max-w-sm">
          <h2 className="text-lg font-bold mb-1">Sign in</h2>
          <p className="text-sm text-[var(--muted)] mb-6">Use your Universal Systems account</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1 block">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)] mb-1 block">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex justify-between text-xs">
              <label className="flex items-center gap-1.5">
                <input type="checkbox" className="rounded" /> Remember me
              </label>
              <Link href="/forgot-password" className="text-[var(--primary)] hover:underline">Forgot?</Link>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-xs text-[var(--muted)] text-center">
            Demo: admin@universal.com / admin123
          </p>
          <p className="mt-2 text-xs text-center">
            No account? <Link href="/signup" className="text-[var(--primary)] font-semibold">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
