"use client";

import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
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
    // Register the token fetcher while constructing the client. The client
    // connects on the first query subscription, which can run before mount
    // effects — deferring this to useEffect would let queries authenticate
    // twice and rerun.
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
  // Lazy useState init creates the clients exactly once per component
  // instance instead of on every render.
  const [{ convex, queryClient }] = useState(getClients);
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
