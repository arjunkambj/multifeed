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
    key: "starter",
    name: "Starter",
    description: "Perfect for small teams and individual creators getting started.",
    priceAmount: 49,
    currency: "USD",
    interval: "month",
    features: [
      "Unlimited tracked accounts",
      "Up to 150 videos",
      "24-hour data refresh",
      "Creator portals",
      "Contract management",
      "2 team seats",
      "Email support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    description: "For growing brands scaling their creator campaigns.",
    priceAmount: 99,
    currency: "USD",
    interval: "month",
    features: [
      "Starter features, plus:",
      "Unlimited tracked accounts",
      "Up to 1,000 videos",
      "24-hour data refresh",
      "Revenue tracking & attribution",
      "Creator campaigns",
      "Creator portals",
      "Contract management",
      "5 team seats",
      "Priority support",
    ],
  },
  {
    key: "ultra",
    name: "Ultra",
    description: "For agencies and large teams with high-volume needs.",
    priceAmount: 299,
    currency: "USD",
    interval: "month",
    features: [
      "Pro features, plus:",
      "Unlimited tracked accounts",
      "Up to 5,000 videos",
      "12-hour data refresh",
      "Revenue tracking & attribution",
      "Creator campaigns",
      "15 team seats",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];
