import { type LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string;
  group?: string;
}

export const navigationGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { title: "Activity Center", href: "/activity", icon: "Activity" },
      { title: "KPI Analytics", href: "/kpi-analytics", icon: "TrendingUp" },
    ],
  },
  {
    label: "Inventory Core",
    items: [
      { title: "Products", href: "/products", icon: "Package" },
      { title: "Inventory", href: "/inventory", icon: "Boxes" },
      { title: "Warehouses", href: "/warehouses", icon: "Warehouse" },
      { title: "Stock Timeline", href: "/stock-timeline", icon: "GitBranch" },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { title: "Sales Orders", href: "/sales", icon: "ShoppingCart" },
      { title: "Customers", href: "/customers", icon: "Users" },
      { title: "Deliveries", href: "/deliveries", icon: "Truck" },
      { title: "Invoices", href: "/invoices", icon: "FileText" },
      { title: "Payments", href: "/payments", icon: "CreditCard" },
    ],
  },
  {
    label: "Procurement",
    items: [
      { title: "Purchase Orders", href: "/purchases", icon: "ShoppingBag" },
      { title: "Vendors", href: "/vendors", icon: "Building2" },
      { title: "Procurement Auto", href: "/procurement", icon: "Zap" },
    ],
  },
  {
    label: "Manufacturing",
    items: [
      { title: "Manufacturing", href: "/manufacturing", icon: "Factory" },
      { title: "Bill of Materials", href: "/bom", icon: "Layers" },
      { title: "Work Centers", href: "/work-centers", icon: "Cog" },
      { title: "Kanban Board", href: "/kanban", icon: "Kanban" },
      { title: "Calendar", href: "/calendar", icon: "Calendar" },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "AI Analytics", href: "/ai-analytics", icon: "Brain" },
      { title: "AI Copilot", href: "/ai-chat", icon: "Bot" },
      { title: "Blockchain", href: "/blockchain", icon: "Link" },
      { title: "Audit Logs", href: "/audit-logs", icon: "Shield" },
      { title: "Reports", href: "/reports", icon: "BarChart3" },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Users", href: "/users", icon: "UserCog" },
      { title: "Roles & Permissions", href: "/roles", icon: "Lock" },
      { title: "Security", href: "/security", icon: "ShieldCheck" },
      { title: "System Health", href: "/system-health", icon: "HeartPulse" },
      { title: "Export & Import", href: "/export-import", icon: "Upload" },
      { title: "Settings", href: "/settings", icon: "Settings" },
      { title: "Help & Support", href: "/help", icon: "HelpCircle" },
    ],
  },
];

export const allNavItems = navigationGroups.flatMap((g) => g.items);

export const commandItems = allNavItems.map((item) => ({
  ...item,
  keywords: item.title,
}));
