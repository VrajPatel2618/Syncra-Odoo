import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem("syncra_token", token);
        localStorage.setItem("syncra_user", JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem("syncra_token");
        localStorage.removeItem("syncra_user");
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: "syncra-auth" }
  )
);

interface UIState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  aiCopilotOpen: boolean;
  commandPaletteOpen: boolean;
  notificationPanelOpen: boolean;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleAiCopilot: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNotificationPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: "light",
      aiCopilotOpen: false,
      commandPaletteOpen: false,
      notificationPanelOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setTheme: (theme) => {
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
        set({ theme });
      },
      toggleAiCopilot: () => set((s) => ({ aiCopilotOpen: !s.aiCopilotOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
    }),
    { name: "syncra-ui" }
  )
);
