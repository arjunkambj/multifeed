import "server-only";

import type { ServerTeam } from "@hexclave/next";
import { cache } from "react";
import { redirect } from "next/navigation";
import {
  getHexclaveConvexServerToken,
  hexclaveServerApp,
} from "@/hexclave/server";

/** Request-memoized auth shared by the dashboard layout and its page. */
export const requireDashboardSession = cache(async () => {
  const [user, convexToken] = await Promise.all([
    hexclaveServerApp.getUser(),
    getHexclaveConvexServerToken(),
  ]);

  if (!user || !convexToken) {
    redirect("/sign-in");
  }

  if (!user.selectedTeam) {
    redirect("/created-org");
  }

  return {
    user,
    convexToken,
    team: user.selectedTeam as ServerTeam,
  };
});
