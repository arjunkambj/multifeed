import "server-only";

import type { BillingInterval, PlanKey } from "@/constants/plans";

type DodoEnvironment = "test_mode" | "live_mode";

const productEnvNames: Record<PlanKey, Record<BillingInterval, string>> = {
  creator: {
    month: "DODO_CREATOR_MONTHLY_PRODUCT_ID",
    year: "DODO_CREATOR_YEARLY_PRODUCT_ID",
  },
  growth: {
    month: "DODO_GROWTH_MONTHLY_PRODUCT_ID",
    year: "DODO_GROWTH_YEARLY_PRODUCT_ID",
  },
  agency: {
    month: "DODO_AGENCY_MONTHLY_PRODUCT_ID",
    year: "DODO_AGENCY_YEARLY_PRODUCT_ID",
  },
};

const optionalEnv = (name: string) => process.env[name]?.trim();

export const getDodoEnvironment = (): DodoEnvironment =>
  process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
    ? "live_mode"
    : "test_mode";

export const getDodoApiKey = () => optionalEnv("DODO_PAYMENTS_API_KEY");

export const getDodoProductId = (
  planKey: PlanKey,
  interval: BillingInterval,
) => optionalEnv(productEnvNames[planKey][interval]);
