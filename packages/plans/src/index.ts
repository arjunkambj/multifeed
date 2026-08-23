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
    description: "For one person posting across a few accounts.",
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
      "Post to multiple accounts",
      "Image, video, and carousel posts",
      "Different captions per platform",
      "Basic analytics",
    ],
  }),
  growth: definePlan({
    key: "growth",
    name: "Growth",
    description: "For a small team sharing a calendar.",
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
      "Faster analytics",
    ],
  }),
  agency: definePlan({
    key: "agency",
    name: "Agency",
    description: "For people running a lot of client accounts.",
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
      "Team approvals",
      "API add-on available",
      "Priority support",
    ],
  }),
};

export const PLANS = PLAN_KEYS.map((key) => PLAN_BY_KEY[key]);

export const getPlan = (key: PlanKey) => PLAN_BY_KEY[key];

export const getPlanLimits = (key: PlanKey | null): PlanLimits =>
  key === null ? NO_PLAN_LIMITS : PLAN_BY_KEY[key].limits;
