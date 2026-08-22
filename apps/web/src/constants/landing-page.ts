import { PLANS, type PlanKey } from "@multifeed/plans";

export const faqItems = [
  {
    content:
      "Connect an account, create a post, and choose when it should go live. You can add the rest of your channels whenever you’re ready.",
    title: "How quickly can I get started?",
  },
  {
    content:
      "Instagram, TikTok, YouTube, LinkedIn, X, Facebook, and Threads. Available post formats vary by platform.",
    title: "Which platforms are supported?",
  },
  {
    content:
      "Yes. Start with one main caption, then add platform-specific copy and settings wherever the message or format needs to change.",
    title: "Can I tailor a post for each platform?",
  },
  {
    content:
      "MultiFeed supports text, images, videos, carousels, Reels, Shorts, and Stories where each connected platform allows them.",
    title: "What kinds of posts can I schedule?",
  },
  {
    content:
      "Yes. Use the month, week, day, or list view to review what is coming up. Drag a post to reschedule it without rebuilding the post.",
    title: "Can I review and change my schedule?",
  },
] as const;

export const featureItems = [
  {
    ctaPrimary: "Tailor your first post",
    description:
      "Draft one post, then tailor the caption and settings for every channel without starting over.",
    eyebrow: "Platform-specific posts",
    heading: "One draft, seven channels",
  },
  {
    ctaPrimary: "Open the calendar",
    description:
      "See your month, week, day, or list at a glance. Drag any post to change its publish time.",
    eyebrow: "Visual calendar",
    heading: "Visual content calendar",
  },
  {
    ctaPrimary: "Connect your accounts",
    description:
      "Schedule text, images, videos, Reels, Shorts, and Stories wherever each platform supports them.",
    eyebrow: "Multi-platform scheduling",
    heading: "Multi-platform scheduling",
  },
] as const;

const planBadges: Record<PlanKey, string> = {
  creator: "For solo work",
  growth: "Most popular",
  agency: "For scale",
};

export const pricingPlans = PLANS.map((plan) => ({
  badge: planBadges[plan.key],
  cta: "Choose this plan",
  description: plan.description,
  features: plan.features,
  monthlyPrice: `$${plan.prices.month}`,
  name: plan.name,
  period: "/month",
  preferred: plan.key === "growth",
  yearlyPrice: `$${plan.prices.year}`,
}));
