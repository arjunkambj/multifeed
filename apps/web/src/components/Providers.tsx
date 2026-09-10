"use client";

import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { clientEnv } from "@/env";
import { hexclaveClientApp } from "@/hexclave/client";

function createClients() {
  const convex = new ConvexReactClient(clientEnv.NEXT_PUBLIC_CONVEX_URL, {
    // Reuse the first accepted token instead of immediately authenticating
    // twice and rerunning every dashboard query.
    initialAuthTokenReuse: true,
  });
  if (typeof window !== "undefined") {
    convex.setAuth(hexclaveClientApp.getConvexClientAuth({}));
  }
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30_000,
      },
    },
  });
  return { convex, queryClient };
}

let browserClients: ReturnType<typeof createClients> | undefined;

function getClients() {
  // Each server render gets its own cache; browser clients survive Suspense retries.
  if (typeof window === "undefined") return createClients();
  browserClients ??= createClients();
  return browserClients;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const { convex, queryClient } = getClients();
  return (
    <HexclaveProvider app={hexclaveClientApp}>
      <HexclaveTheme>
        <ConvexProvider client={convex}>
          <ConvexQueryCacheProvider>
            <QueryClientProvider client={queryClient}>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </QueryClientProvider>
          </ConvexQueryCacheProvider>
        </ConvexProvider>
      </HexclaveTheme>
    </HexclaveProvider>
  );
}
