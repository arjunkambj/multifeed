"use client";

import {
  isServer,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TimezoneCookie } from "@/components/layout/TimezoneCookie";
import { clientEnv } from "@/env";
import { hexclaveClientApp } from "@/hexclave/client";

const convex = new ConvexReactClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30_000,
      },
    },
  });

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) return createQueryClient();
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

convex.setAuth(hexclaveClientApp.getConvexClientAuth({}));

export default function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ConvexProvider client={convex}>
        <ConvexQueryCacheProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <TimezoneCookie />
            <Toaster />
            {children}
          </ThemeProvider>
        </ConvexQueryCacheProvider>
      </ConvexProvider>
    </QueryClientProvider>
  );
}
