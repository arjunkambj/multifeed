export interface Plan {
  key: "creator" | "growth" | "agency";
  name: string;
  description: string;
  prices: Record<"month" | "year", number>;
  currency: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    key: "creator",
    name: "Creator",
    description:
      "Best for solo creators and founders scheduling across core channels.",
    prices: {
      month: 29,
      year: 23,
    },
    currency: "USD",
    features: [
      "15 connected social accounts",
      "Unlimited scheduled posts",
      "Multi-account posting",
      "Image, video, and carousel posts",
      "Platform caption overrides",
      "Basic analytics refresh",
      "2 team seats",
    ],
  },
  {
    key: "growth",
    name: "Growth",
    description: "Best for teams managing multiple brands and calendars.",
    prices: {
      month: 59,
      year: 47,
    },
    currency: "USD",
    features: [
      "50 connected social accounts",
      "Everything in Creator",
      "Calendar and status views",
      "Shared inbox",
      "Advanced analytics history",
      "Priority metric refresh",
      "5 team seats",
    ],
  },
  {
    key: "agency",
    name: "Agency",
    description: "Best for agencies and brands with high-volume publishing.",
    prices: {
      month: 119,
      year: 95,
    },
    currency: "USD",
    features: [
      "Unlimited connected accounts",
      "Everything in Growth",
      "Bulk video scheduling",
      "Approval-ready team workflows",
      "API add-on available",
      "Priority support",
      "15 team seats",
    ],
  },
];

export type PlanKey = (typeof PLANS)[number]["key"];
export type BillingInterval = keyof Plan["prices"];

export const getPlan = (key: PlanKey) => PLANS.find((plan) => plan.key === key);
