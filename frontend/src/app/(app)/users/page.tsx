"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { systemApi } from "@/lib/api";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCog, Trash2, Edit2 } from "lucide-react";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", role: "VIEWER", password: "", panels: [] as string[] });

  const { data, isLoading } = useQuery({ queryKey: ["users"], queryFn: () => systemApi.users().then(r => r.data.data).catch(() => [
    { firstName: "Rajesh", lastName: "Sharma", email: "admin@universal.com", role: "ADMIN", isActive: true, lastLogin: new Date().toISOString() },
  ])});

  const createUser = useMutation({
    mutationFn: () => systemApi.createUser(formData),
    onSuccess: () => {
      toast.success("User created successfully");
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFormData({ firstName: "", lastName: "", email: "", role: "VIEWER", password: "", panels: [] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to create user")
  });

  const updateUser = useMutation({
    mutationFn: () => systemApi.updateUser(editingUserId!, formData),
    onSuccess: () => {
      toast.success("User updated successfully");
      setShowModal(false);
      setEditingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setFormData({ firstName: "", lastName: "", email: "", role: "VIEWER", password: "", panels: [] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Failed to update user")
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
      <PageHeader 
        title="User Management" 
        description="User accounts, roles, and access control" 
        icon={UserCog} 
        action={{ 
          label: "+ Add User", 
          onClick: () => {
            setEditingUserId(null);
            setFormData({ firstName: "", lastName: "", email: "", role: "VIEWER", password: "", panels: [] });
            setShowModal(true);
          } 
        }} 
      />
      
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--surface)] p-6 rounded-lg w-full max-w-md border border-[var(--border)]">
            <h2 className="text-lg font-bold mb-4">{editingUserId ? "Edit User" : "Add New User"}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <Input placeholder="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <Input placeholder="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <Input placeholder="Password (Optional)" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              
              <select className="flex h-9 w-full rounded border border-[var(--border)] bg-[var(--surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
                <option value="SALES">Sales</option>
                <option value="PRODUCT">Product</option>
                <option value="MANUFACTURING">Manufacturing</option>
                <option value="INTELLIGENCE">Intelligence</option>
                <option value="INVENTORY">Inventory</option>
              </select>
              
              <div className="mt-4 border-t border-[var(--border)] pt-4">
                <p className="text-xs font-semibold mb-2">Custom Panel Access (Overrides Role Base):</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['dashboard', 'inventory', 'sales', 'purchase', 'manufacturing', 'audit_log', 'user_management', 'blockchain'].map(panel => (
                    <label key={panel} className="flex items-center gap-1.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.panels.includes(panel)}
                        onChange={e => {
                          const newPanels = e.target.checked 
                            ? [...formData.panels, panel]
                            : formData.panels.filter(p => p !== panel);
                          setFormData({ ...formData, panels: newPanels });
                        }}
                        className="h-4 w-4 rounded border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] focus:ring-[var(--primary)]/30 focus:ring-offset-0 focus:outline-none"
                      />
                      <span className="capitalize">{panel.replace(/_/g, " ")}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--border)]">
              <Button variant="outline" onClick={() => { setShowModal(false); setEditingUserId(null); }}>Cancel</Button>
              <Button 
                onClick={() => editingUserId ? updateUser.mutate() : createUser.mutate()} 
                disabled={createUser.isPending || updateUser.isPending || !formData.email || !formData.firstName}
              >
                {createUser.isPending || updateUser.isPending ? "Saving..." : (editingUserId ? "Update User" : "Save User")}
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data||[]).map((u: {id:string; firstName:string; lastName:string; email:string; role:string; panels?:any; isActive?:boolean}) => (
          <Card key={u.email} className="p-6 relative group"><CardContent className="p-0">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 text-[var(--muted)] hover:text-[var(--primary)]"
                onClick={() => {
                  let parsedPanels = [];
                  if (u.panels) {
                    try { parsedPanels = typeof u.panels === 'string' ? JSON.parse(u.panels) : u.panels; } catch(e) {}
                  }
                  setFormData({ firstName: u.firstName, lastName: u.lastName, email: u.email, role: u.role, password: "", panels: Array.isArray(parsedPanels) ? parsedPanels : [] });
                  setEditingUserId(u.id);
                  setShowModal(true);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this user?")) {
                    deleteUser.mutate(u.id);
                  }
                }}
                disabled={deleteUser.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
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
