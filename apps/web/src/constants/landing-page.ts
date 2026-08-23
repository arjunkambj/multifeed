import { PLANS, type PlanKey } from "@multifeed/plans";

export const faqItems = [
  {
    content:
      "Sign in with one platform, write a post, and pick a time. Adding the other six channels takes a couple of minutes each.",
    title: "How do I get started?",
  },
  {
    content:
      "Instagram, TikTok, YouTube, LinkedIn, X, and Facebook Pages. Each platform decides which post formats it accepts.",
    title: "Which platforms are supported?",
  },
  {
    content:
      "Yes. Every post starts with one caption. Each connected account can get its own text, first comment, alt text, and visibility settings.",
    title: "Can I write different captions per platform?",
  },
  {
    content:
      "Text, images, videos, and carousels, plus Reels, Shorts, and Stories on the platforms that support them. The composer only shows formats the target account accepts.",
    title: "What kinds of posts can I schedule?",
  },
  {
    content:
      "Yes. Month, week, day, and list views show everything coming up. Drag a post to a new slot and it reschedules everywhere, in your timezone.",
    title: "Can I reschedule after I've planned the week?",
  },
] as const;

export const featureItems = [
  {
    ctaPrimary: "Try the composer",
    mock: "overrides",
    description:
      "Write the post once. Then give LinkedIn its longer version, X its shorter one, and TikTok a first comment, each in the same composer.",
    eyebrow: "Per-platform overrides",
    heading: "One draft, six channels",
  },
  {
    ctaPrimary: "See the calendar",
    mock: "calendar",
    description:
      "Month, week, day, and list views. Drag a post to a new slot and it reschedules everywhere, in your timezone.",
    eyebrow: "Drag-and-drop calendar",
    heading: "A calendar you can actually move things around on",
  },
  {
    ctaPrimary: "Connect your accounts",
    mock: "formats",
    description:
      "Reels, Shorts, Stories, carousels, plain text. The composer reads each platform's rules and only offers what will actually publish.",
    eyebrow: "Native formats",
    heading: "Every format each platform supports",
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
