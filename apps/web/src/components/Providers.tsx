"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { clientEnv } from "@/env";
import { hexclaveClientApp } from "@/hexclave/client";

const convex = new ConvexReactClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

convex.setAuth(hexclaveClientApp.getConvexClientAuth({}));

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConvexProvider client={convex}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
        </ThemeProvider>
      </ConvexProvider>
    </QueryClientProvider>
  );
}
