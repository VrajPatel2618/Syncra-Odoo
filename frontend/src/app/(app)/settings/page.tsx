"use client";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, User, Bell, Shield, Sparkles, Link2 } from "lucide-react";
import { useUIStore } from "@/lib/stores";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "ai", label: "AI Config", icon: Sparkles },
  { id: "blockchain", label: "Blockchain", icon: Link2 },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const { theme, setTheme } = useUIStore();

  return (
    <div>
      <PageHeader title="Settings" description="Configure ERP preferences and integrations" icon={Settings} />
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 space-y-1">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-3 w-full rounded-xl px-4 py-2.5 text-sm transition-all ${activeTab === t.id ? "bg-indigo-500/20 text-indigo-300" : "text-muted hover:bg-indigo-500/10"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>
        <Card className="flex-1 p-6">
          <CardContent className="p-0 space-y-4">
            {activeTab === "profile" && (<>
              <h3 className="font-semibold">Company Profile</h3>
              <Input defaultValue="Universal Systems Inc." placeholder="Company Name" />
              <Input defaultValue="Industrial Area, Rajkot, Gujarat" placeholder="Address" />
              <div className="flex gap-4"><div className="flex-1"><label className="text-sm text-muted">Theme</label>
                <div className="flex gap-2 mt-2"><Button size="sm" variant={theme === "dark" ? "default" : "secondary"} onClick={() => setTheme("dark")}>Dark</Button>
                <Button size="sm" variant={theme === "light" ? "default" : "secondary"} onClick={() => setTheme("light")}>Light</Button></div></div></div>
            </>)}
            {activeTab === "ai" && (<><h3 className="font-semibold">AI Configuration</h3><Input placeholder="OpenAI API Key" type="password" /><Input placeholder="Gemini API Key" type="password" /><p className="text-xs text-muted">AI works in mock mode without API keys</p></>)}
            {activeTab === "blockchain" && (<><h3 className="font-semibold">Blockchain Config</h3><Input defaultValue="polygon" placeholder="Network" /><Input placeholder="Contract Address" /><p className="text-xs text-muted">Audit layer uses hash-only mode without contract</p></>)}
            {activeTab === "notifications" && (<><h3 className="font-semibold">Notification Preferences</h3>{["Low Stock Alerts", "Procurement Alerts", "AI Insights", "Delivery Updates"].map(n => (<label key={n} className="flex items-center gap-2 py-2"><input type="checkbox" defaultChecked className="rounded accent-indigo-500" />{n}</label>))}</>)}
            {activeTab === "security" && (<><h3 className="font-semibold">Security Settings</h3><label className="flex items-center gap-2"><input type="checkbox" className="rounded accent-[var(--primary)]" /> Enable Two-Factor Authentication</label></>)}
            <Button 
              variant="glow" 
              className="mt-4" 
              onClick={() => {
                const btn = document.activeElement as HTMLButtonElement;
                if (btn) btn.disabled = true;
                setTimeout(() => {
                  toast.success("Settings saved successfully");
                  if (btn) btn.disabled = false;
                }, 800);
              }}
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
