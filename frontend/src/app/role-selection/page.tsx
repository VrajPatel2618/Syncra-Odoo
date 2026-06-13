"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Hexagon, Shield, Factory, ShoppingCart, Warehouse, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/stores";
import { toast } from "sonner";

const roles = [
  { id: "SUPER_ADMIN", label: "Super Admin", desc: "Full system access", icon: Shield, color: "from-red-600 to-orange-600" },
  { id: "MANAGER", label: "Manager", desc: "Operations & analytics", icon: Factory, color: "from-indigo-600 to-purple-600" },
  { id: "SALES", label: "Sales", desc: "Orders & customers", icon: ShoppingCart, color: "from-cyan-600 to-blue-600" },
  { id: "WAREHOUSE", label: "Warehouse", desc: "Inventory & deliveries", icon: Warehouse, color: "from-emerald-600 to-teal-600" },
  { id: "VIEWER", label: "Viewer", desc: "Read-only dashboards", icon: Eye, color: "from-slate-600 to-slate-500" },
];

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user, setAuth, token } = useAuthStore();

  const selectRole = (roleId: string) => {
    if (user && token) {
      setAuth({ ...user, role: roleId }, token);
    }
    toast.success(`Role set to ${roleId.replace(/_/g, " ")}`);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] p-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <Hexagon className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold font-[family-name:var(--font-poppins)]">Select Your Role</h1>
          <p className="text-muted">Choose how you&apos;ll operate in Syncra ERP</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role, i) => (
            <motion.button
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => selectRole(role.id)}
              className="glass rounded-2xl p-6 text-left hover:border-indigo-500/40 transition-all group"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${role.color} mb-4 group-hover:scale-110 transition-transform`}>
                <role.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold">{role.label}</h3>
              <p className="text-sm text-muted mt-1">{role.desc}</p>
            </motion.button>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>Skip for now</Button>
        </div>
      </div>
    </div>
  );
}
