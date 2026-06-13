"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import { useUIStore } from "@/lib/stores";
import { useMounted } from "@/hooks/use-mounted";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
  }));
  const theme = useUIStore((s) => s.theme);
  const mounted = useMounted();

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  // Default light theme on first load
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {mounted && (
        <Toaster
          theme={theme}
          position="top-right"
          toastOptions={{
            className: "glass border border-indigo-500/20",
          }}
        />
      )}
    </QueryClientProvider>
  );
}
