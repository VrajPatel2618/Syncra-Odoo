import { type LucideIcon } from "lucide-react";
import { ModuleType } from "./permissions";

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  group?: string;
  moduleId?: ModuleType;
}

export const navigationGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", moduleId: "dashboard" },
      { title: "Activity Center", href: "/activity", icon: "Activity", moduleId: "dashboard" },
      { title: "KPI Analytics", href: "/kpi-analytics", icon: "TrendingUp", moduleId: "dashboard" },
    ],
  },
  {
    label: "Inventory Core",
    items: [
      { title: "Products", href: "/products", icon: "Package", moduleId: "inventory" },
      { title: "Inventory", href: "/inventory", icon: "Boxes", moduleId: "inventory" },
      { title: "Warehouses", href: "/warehouses", icon: "Warehouse", moduleId: "inventory" },
      { title: "Stock Timeline", href: "/stock-timeline", icon: "GitBranch", moduleId: "inventory" },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { title: "Sales Orders", href: "/sales", icon: "ShoppingCart", moduleId: "sales" },
      { title: "Customers", href: "/customers", icon: "Users", moduleId: "sales" },
      { title: "Deliveries", href: "/deliveries", icon: "Truck", moduleId: "sales" },
      { title: "Invoices", href: "/invoices", icon: "FileText", moduleId: "sales" },
      { title: "Payments", href: "/payments", icon: "CreditCard", moduleId: "sales" },
    ],
  },
  {
    label: "Procurement",
    items: [
      { title: "Purchase Orders", href: "/purchases", icon: "ShoppingBag", moduleId: "purchase" },
      { title: "Vendors", href: "/vendors", icon: "Building2", moduleId: "purchase" },
      { title: "Procurement Auto", href: "/procurement", icon: "Zap", moduleId: "purchase" },
    ],
  },
  {
    label: "Manufacturing",
    items: [
      { title: "Manufacturing", href: "/manufacturing", icon: "Factory", moduleId: "manufacturing" },
      { title: "Bill of Materials", href: "/bom", icon: "Layers", moduleId: "manufacturing" },
      { title: "Work Centers", href: "/work-centers", icon: "Cog", moduleId: "manufacturing" },
      { title: "Kanban Board", href: "/kanban", icon: "Kanban", moduleId: "manufacturing" },
      { title: "Calendar", href: "/calendar", icon: "Calendar", moduleId: "manufacturing" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "AI Copilot", href: "/ai-chat", icon: "Bot", moduleId: "dashboard" },
      { title: "Blockchain", href: "/blockchain", icon: "Link", moduleId: "blockchain" },
      { title: "Audit Logs", href: "/audit-logs", icon: "Shield", moduleId: "audit_log" },
      { title: "Reports", href: "/reports", icon: "BarChart3", moduleId: "dashboard" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Users", href: "/users", icon: "UserCog", moduleId: "user_management" },
      { title: "Roles & Permissions", href: "/roles", icon: "Lock", moduleId: "user_management" },
      { title: "Security", href: "/security", icon: "ShieldCheck", moduleId: "user_management" },
      { title: "System Health", href: "/system-health", icon: "HeartPulse", moduleId: "user_management" },
      { title: "Export & Import", href: "/export-import", icon: "Upload", moduleId: "user_management" },
      { title: "Settings", href: "/settings", icon: "Settings", moduleId: "dashboard" },
      { title: "Help & Support", href: "/help", icon: "HelpCircle", moduleId: "dashboard" },
    ],
  },
];

export const allNavItems = navigationGroups.flatMap((g) => g.items);

export const commandItems = allNavItems.map((item) => ({
  ...item,
  keywords: item.title,
}));
