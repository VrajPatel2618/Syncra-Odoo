import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("syncra_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("syncra_token");
      localStorage.removeItem("syncra_user");
      localStorage.removeItem("syncra-auth");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) => api.post("/auth/login", { email, password }),
  register: (data: Record<string, string>) => api.post("/auth/register", data),
  me: () => api.get("/auth/me"),
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
  activity: () => api.get("/dashboard/activity"),
};

export const productsApi = {
  list: (params?: Record<string, string>) => api.get("/products", { params }),
  get: (id: string) => api.get(`/products/${id}`),
  categories: () => api.get("/products/categories"),
  create: (data: Record<string, unknown>) => api.post("/products", data),
};

export const inventoryApi = {
  list: () => api.get("/inventory"),
  movements: (params?: Record<string, string>) => api.get("/inventory/movements", { params }),
  alerts: () => api.get("/inventory/alerts"),
};

export const salesApi = {
  list: () => api.get("/sales"),
  get: (id: string) => api.get(`/sales/${id}`),
  create: (data: Record<string, unknown>) => api.post("/sales", data),
  confirm: (id: string) => api.patch(`/sales/${id}/confirm`),
  deliver: (id: string) => api.patch(`/sales/${id}/deliver`),
  invoice: (id: string) => api.post(`/sales/${id}/invoice`),
  pay: (id: string, data?: { amount?: number; method?: string }) => api.post(`/sales/${id}/pay`, data || {}),
};

export const purchaseApi = {
  list: () => api.get("/purchases"),
  create: (data: Record<string, unknown>) => api.post("/purchases", data),
  confirm: (id: string) => api.patch(`/purchases/${id}/confirm`),
  receive: (id: string) => api.patch(`/purchases/${id}/receive`),
};

export const manufacturingApi = {
  orders: () => api.get("/manufacturing/orders"),
  workCenters: () => api.get("/manufacturing/work-centers"),
  boms: () => api.get("/manufacturing/boms"),
  createOrder: (data: Record<string, unknown>) => api.post("/manufacturing/orders", data),
  startOrder: (id: string) => api.patch(`/manufacturing/orders/${id}/start`),
  completeOrder: (id: string) => api.patch(`/manufacturing/orders/${id}/complete`),
};

export const systemApi = {
  aiChat: (message: string) => api.post("/system/chat", { message }),
  aiInsights: () => api.get("/system/insights"),
  blockchainStatus: () => api.get("/system/blockchain/status"),
  blockchainLogs: () => api.get("/system/blockchain/logs"),
  auditLogs: () => api.get("/system/audit-logs"),
  notifications: () => api.get("/system/notifications"),
  health: () => api.get("/system/health"),
  customers: () => api.get("/customers"),
  createCustomer: (data: any) => api.post("/customers", data),
  vendors: () => api.get("/vendors"),
  createVendor: (data: any) => api.post("/vendors", data),
  warehouses: () => api.get("/warehouses"),
  createWarehouse: (data: any) => api.post("/warehouses", data),
  deliveries: () => api.get("/deliveries"),
  invoices: () => api.get("/invoices"),
  payments: () => api.get("/payments"),
  users: () => api.get("/users"),
  createUser: (data: any) => api.post("/users", data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  markNotificationRead: (id: string) => api.patch(`/system/notifications/${id}/read`),
  procurementRules: () => api.get("/procurement/rules"),
  executeProcurement: (productId: string) => api.post(`/procurement/execute/${productId}`),
  reports: () => api.get("/reports"),
  reportSummary: (type: string) => api.get(`/reports/${type}/summary`),
  settings: () => api.get("/settings"),
};

export const authApiExtended = {
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  verifyOtp: (code: string) => api.post("/auth/verify-otp", { code }),
};
