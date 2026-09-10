import "server-only";

import type { BillingInterval, PlanKey } from "@multifeed/plans";

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

/**
 * True when this deployment is not a local development app — a missing or
 * misspelled DODO_PAYMENTS_ENVIRONMENT must fail loudly there instead of
 * silently talking to Dodo test mode.
 */
const isProductionRuntime = (): boolean => {
  if (process.env.NODE_ENV === "production") return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return false;
  try {
    const { hostname } = new URL(appUrl);
    return hostname !== "localhost" && hostname !== "127.0.0.1";
  } catch {
    return false;
  }
};

export const getDodoEnvironment = (): DodoEnvironment => {
  const value = optionalEnv("DODO_PAYMENTS_ENVIRONMENT");
  if (value === "live_mode" || value === "test_mode") return value;
  if (isProductionRuntime()) {
    throw new Error(
      'DODO_PAYMENTS_ENVIRONMENT must be set to "live_mode" or "test_mode" in production',
    );
  }
  if (value) {
    console.warn(
      `[billing] Ignoring unrecognized DODO_PAYMENTS_ENVIRONMENT (${JSON.stringify(value)}); defaulting to test_mode`,
    );
  }
  return "test_mode";
};

export const getDodoApiKey = () => optionalEnv("DODO_PAYMENTS_API_KEY");

export const getDodoProductId = (planKey: PlanKey, interval: BillingInterval) =>
  optionalEnv(productEnvNames[planKey][interval]);
