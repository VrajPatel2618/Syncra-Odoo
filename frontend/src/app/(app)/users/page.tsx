"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { systemApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Trash2 } from "lucide-react";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", role: "VIEWER", department: "Audit", password: "" });

  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => systemApi.users().then(r => r.data.data).catch(() => [
    { firstName: "Rajesh", lastName: "Sharma", email: "admin@universal.com", role: "ADMIN", isActive: true, lastLogin: new Date().toISOString() },
  ])});

  const createUser = useMutation({
    mutationFn: () => systemApi.createUser(formData),
    onSuccess: () => {
      toast.success("User created successfully");
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFormData({ firstName: "", lastName: "", email: "", role: "VIEWER", department: "Audit", password: "" });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create user")
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => systemApi.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to delete user")
  });

  return (
    <div>
      <PageHeader title="User Management" description="User accounts, roles, and access control" icon={UserCog} action={{ label: "+ Add User", onClick: () => setShowModal(true) }} />
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] p-6 rounded-lg w-full max-w-md border border-[var(--border)]">
            <h2 className="text-lg font-bold mb-4">Add New User</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm" placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <input className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm" placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <input className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm" placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm" placeholder="Password (Optional)" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              <select className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="ADMIN">Admin</option>
                <option value="SALES_MANAGER">Sales Manager</option>
                <option value="SALES_EXECUTIVE">Sales Executive</option>
                <option value="PURCHASE_MANAGER">Purchase Manager</option>
                <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                <option value="PRODUCTION_MANAGER">Production Manager</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <input className="w-full bg-[var(--background)] border border-[var(--border)] rounded px-3 py-2 text-sm" placeholder="Department" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button onClick={() => createUser.mutate()} disabled={createUser.isPending || !formData.email || !formData.firstName}>
                {createUser.isPending ? "Saving..." : "Save User"}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data||[]).map((u: {id:string; firstName:string; lastName:string; email:string; role:string; isActive?:boolean}) => (
          <Card key={u.email} className="p-6 relative group"><CardContent className="p-0">
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                if (window.confirm("Are you sure you want to delete this user?")) {
                  deleteUser.mutate(u.id);
                }
              }}
              disabled={deleteUser.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">{u.firstName[0]}{u.lastName[0]}</div>
              <div><p className="font-semibold">{u.firstName} {u.lastName}</p><p className="text-xs text-muted">{u.email}</p></div>
            </div>
            <Badge>{u.role.replace(/_/g, " ")}</Badge>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
