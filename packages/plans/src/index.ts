export const PLAN_KEYS = ["creator", "growth", "agency"] as const;

export type PlanKey = (typeof PLAN_KEYS)[number];
export type BillingInterval = "month" | "year";

export interface PlanLimits {
  /** `null` means unlimited. */
  connectedAccounts: number | null;
  /** Additional teammates; the workspace owner does not consume a seat. */
  teamSeats: number;
}

export interface Plan {
  key: PlanKey;
  name: string;
  description: string;
  prices: Record<BillingInterval, number>;
  currency: string;
  limits: PlanLimits;
  features: string[];
}

const TRIAL_DAYS = 7;

export const FREE_TRIAL = {
  cta: `Start ${TRIAL_DAYS}-day free trial`,
  days: TRIAL_DAYS,
  summary: `Every plan starts with a ${TRIAL_DAYS}-day free trial.`,
} as const;

export const NO_PLAN_LIMITS: PlanLimits = {
  connectedAccounts: 1,
  teamSeats: 0,
};

const connectedAccountsFeature = (limit: number | null) =>
  limit === null
    ? "Unlimited connected accounts"
    : `${limit} connected social accounts`;

const teamSeatsFeature = (limit: number) => `${limit} team seats`;

const PLAN_BY_KEY: Record<PlanKey, Plan> = {
  creator: {
    key: "creator",
    name: "Creator",
    description:
      "For creators and founders building a consistent social presence.",
    prices: {
      month: 29,
      year: 23,
    },
    currency: "USD",
    limits: {
      connectedAccounts: 15,
      teamSeats: 2,
    },
    features: [
      connectedAccountsFeature(15),
      "Unlimited scheduled posts",
      "Multi-account posting",
      "Image, video, and carousel posts",
      "Platform caption overrides",
      "Basic analytics refresh",
      teamSeatsFeature(2),
    ],
  },
  growth: {
    key: "growth",
    name: "Growth",
    description: "For teams coordinating multiple brands and calendars.",
    prices: {
      month: 59,
      year: 47,
    },
    currency: "USD",
    limits: {
      connectedAccounts: 50,
      teamSeats: 5,
    },
    features: [
      connectedAccountsFeature(50),
      "Everything in Creator",
      "Calendar and status views",
      "Shared inbox",
      "Advanced analytics history",
      "Priority metric refresh",
      teamSeatsFeature(5),
    ],
  },
  agency: {
    key: "agency",
    name: "Agency",
    description: "For agencies managing high-volume client publishing.",
    prices: {
      month: 119,
      year: 95,
    },
    currency: "USD",
    limits: {
      connectedAccounts: null,
      teamSeats: 15,
    },
    features: [
      connectedAccountsFeature(null),
      "Everything in Growth",
      "Bulk video scheduling",
      "Approval-ready team workflows",
      "API add-on available",
      "Priority support",
      teamSeatsFeature(15),
    ],
  },
};

export const PLANS = PLAN_KEYS.map((key) => PLAN_BY_KEY[key]);

export const getPlan = (key: PlanKey) => PLAN_BY_KEY[key];

export const getPlanLimits = (key: PlanKey | null): PlanLimits =>
  key === null ? NO_PLAN_LIMITS : PLAN_BY_KEY[key].limits;
