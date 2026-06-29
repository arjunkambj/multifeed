import { HexclaveClientApp } from "@hexclave/next";
import { clientEnv } from "@/env";

export const hexclaveClientApp = new HexclaveClientApp({
  tokenStore: "nextjs-cookie",
  projectId: clientEnv.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
  publishableClientKey: clientEnv.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY,
  urls: {
    handler: "/handler",
    signIn: "/sign-in",
    afterSignIn: "/overview",
    afterSignUp: "/overview",
    afterSignOut: "/",
  },
});
