export const PLAN_KEYS = ["creator", "growth", "agency"] as const;

export type PlanKey = (typeof PLAN_KEYS)[number];
export type BillingInterval = "month" | "year";

export interface PlanLimits {
  connectedAccounts: number;
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

const connectedAccountsFeature = (limit: number) =>
  `${limit} connected social accounts`;

const teamSeatsFeature = (limit: number) =>
  limit === 0 ? "No team seats" : `${limit} team seats`;

const definePlan = ({
  coreFeatures,
  ...plan
}: Omit<Plan, "features"> & { coreFeatures: string[] }): Plan => ({
  ...plan,
  features: [
    connectedAccountsFeature(plan.limits.connectedAccounts),
    ...coreFeatures,
    teamSeatsFeature(plan.limits.teamSeats),
  ],
});

const PLAN_BY_KEY: Record<PlanKey, Plan> = {
  creator: definePlan({
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
      connectedAccounts: 10,
      teamSeats: 0,
    },
    coreFeatures: [
      "Unlimited scheduled posts",
      "Multi-account posting",
      "Image, video, and carousel posts",
      "Platform caption overrides",
      "Basic analytics refresh",
    ],
  }),
  growth: definePlan({
    key: "growth",
    name: "Growth",
    description: "For teams coordinating multiple brands and calendars.",
    prices: {
      month: 59,
      year: 47,
    },
    currency: "USD",
    limits: {
      connectedAccounts: 30,
      teamSeats: 5,
    },
    coreFeatures: [
      "Everything in Creator",
      "Calendar and status views",
      "Shared inbox",
      "Advanced analytics history",
      "Priority metric refresh",
    ],
  }),
  agency: definePlan({
    key: "agency",
    name: "Agency",
    description: "For agencies managing high-volume client publishing.",
    prices: {
      month: 119,
      year: 95,
    },
    currency: "USD",
    limits: {
      connectedAccounts: 100,
      teamSeats: 15,
    },
    coreFeatures: [
      "Everything in Growth",
      "Bulk video scheduling",
      "Approval-ready team workflows",
      "API add-on available",
      "Priority support",
    ],
  }),
};

export const PLANS = PLAN_KEYS.map((key) => PLAN_BY_KEY[key]);

export const getPlan = (key: PlanKey) => PLAN_BY_KEY[key];

export const getPlanLimits = (key: PlanKey | null): PlanLimits =>
  key === null ? NO_PLAN_LIMITS : PLAN_BY_KEY[key].limits;
