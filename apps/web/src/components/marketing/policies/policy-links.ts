import { clientEnv } from "@/env";

export const SITE_URL = clientEnv.NEXT_PUBLIC_APP_URL;
export const SUPPORT_EMAIL = "support@themultifeed.com";

export const policyLinks = [
  { href: "/policies/privacy", name: "Privacy Policy" },
  { href: "/policies/terms", name: "Terms of Service" },
  { href: "/policies/data-deletion", name: "Data Deletion" },
] as const;
