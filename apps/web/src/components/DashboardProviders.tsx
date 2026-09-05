"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useConvexAuth,
} from "convex/react";
import { ConvexQueryCacheProvider } from "convex-helpers/react/cache/provider";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { clientEnv } from "@/env";
import { hexclaveClientApp } from "@/hexclave/client";

const convex = new ConvexReactClient(clientEnv.NEXT_PUBLIC_CONVEX_URL);
const fetchHexclaveToken = hexclaveClientApp.getConvexClientAuth({});

function useHexclaveAuth() {
  const user = hexclaveClientApp.useUser({ or: "redirect" });
  const userId = user.id;
  const teamId = user.selectedTeam?.id;
  const fetchAccessToken = useCallback(
    (options: { forceRefreshToken: boolean }) =>
      userId && teamId ? fetchHexclaveToken(options) : Promise.resolve(null),
    [userId, teamId],
  );

  return {
    isLoading: false,
    isAuthenticated: !!teamId,
    fetchAccessToken,
  };
}

function DashboardQueries({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  if (isLoading) return <DashboardLoadingSkeleton />;
  if (!isAuthenticated) {
    throw new Error(
      "Could not authenticate with the dashboard. Please sign in again.",
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
    </QueryClientProvider>
  );
}

function DashboardSession({ children }: { children: React.ReactNode }) {
  const user = hexclaveClientApp.useUser({ or: "redirect" });
  const teamId = user.selectedTeam?.id;
  const router = useRouter();

  useEffect(() => {
    if (!teamId) router.replace("/created-org");
  }, [router, teamId]);

  if (!teamId) return <DashboardLoadingSkeleton />;

  return (
    <ConvexProviderWithAuth
      client={convex}
      key={`${user.id}:${teamId}`}
      useAuth={useHexclaveAuth}
    >
      <DashboardQueries>{children}</DashboardQueries>
    </ConvexProviderWithAuth>
  );
}

export function DashboardProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardSession>{children}</DashboardSession>
    </Suspense>
  );
}
