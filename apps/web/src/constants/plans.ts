export interface Plan {
  key: string;
  name: string;
  description: string;
  priceAmount: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
}

export const PLANS: Plan[] = [
  {
    key: "creator",
    name: "Creator",
    description:
      "Best for solo creators and founders scheduling across core channels.",
    priceAmount: 29,
    currency: "USD",
    interval: "month",
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
    priceAmount: 59,
    currency: "USD",
    interval: "month",
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
    priceAmount: 119,
    currency: "USD",
    interval: "month",
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
