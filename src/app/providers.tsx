"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App } from "antd";
import { useState, type ReactNode } from "react";
import { SessionProvider } from "@/components/session-provider";
import { ThemeProvider } from "@/theme/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));

  return (
    <ThemeProvider>
      <App>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>{children}</SessionProvider>
        </QueryClientProvider>
      </App>
    </ThemeProvider>
  );
}
