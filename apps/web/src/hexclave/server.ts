import "server-only";

import { HexclaveServerApp } from "@hexclave/next";
import type { NextRequest } from "next/server";
import { serverEnv } from "@/env";

export const hexclaveServerApp = new HexclaveServerApp({
  tokenStore: "nextjs-cookie",
  projectId: serverEnv.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
  publishableClientKey: serverEnv.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY,
  secretServerKey: process.env.HEXCLAVE_SECRET_SERVER_KEY!,
  urls: {
    handler: "/handler",
    signIn: "/sign-in",
    afterSignIn: "/overview",
    afterSignUp: "/overview",
    afterSignOut: "/",
  },
});

export const getHexclaveConvexServerToken = async (request: NextRequest) => {
  const token = await hexclaveServerApp.getConvexHttpClientAuth({
    tokenStore: request,
  });

  return token.length ? token : null;
};
