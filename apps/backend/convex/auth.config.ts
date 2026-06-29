import { getConvexProvidersConfig } from "@hexclave/next/convex-auth.config";

export default {
  providers: getConvexProvidersConfig({
    projectId: process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID!,
  }),
};
