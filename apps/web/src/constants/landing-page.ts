import { PLANS, type PlanKey } from "./plans";

export const brands = [
  ["TikTok", "https://upload.wikimedia.org/wikipedia/en/a/a9/TikTok_logo.svg"],
  [
    "Instagram",
    "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg",
  ],
  [
    "YouTube",
    "https://upload.wikimedia.org/wikipedia/commons/b/b8/YouTube_Logo_2017.svg",
  ],
  [
    "X",
    "https://upload.wikimedia.org/wikipedia/commons/5/53/X_logo_2023_original.svg",
  ],
] as const;

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
      "Multi Feed supports text, images, videos, carousels, Reels, Shorts, and Stories where each connected platform allows them.",
    title: "What kinds of posts can I schedule?",
  },
  {
    content:
      "Yes. Use the month, week, day, or list view to review what is coming up. Drag a post to reschedule it without rebuilding the post.",
    title: "Can I review and change my schedule?",
  },
  {
    content:
      "Yes. Creator includes two seats, Growth includes five, and Agency includes fifteen, so your team can work from the same calendar.",
    title: "Can my team use Multi Feed?",
  },
] as const;

export const whyUsPoints = [
  {
    cta: "Tailor your first post",
    description:
      "Start with one idea, then adjust the caption and format for each channel. Your message stays consistent without sounding copied and pasted.",
    image:
      "https://framerusercontent.com/images/l1CpF5EzDSCksVlxtEBU1RLqPI.png?scale-down-to=1024",
    subheading: "Platform-specific posts",
    title: "Write once. Sound native everywhere.",
  },
  {
    cta: "See your calendar",
    description:
      "See your entire month, week, or day at a glance. Drag to reschedule, open any post to edit, and catch empty days before they become missed opportunities.",
    image:
      "https://framerusercontent.com/images/veTFqarPod5nyzjlnsyKI6W1o.png?scale-down-to=1024&width=1936&height=1680",
    subheading: "Visual calendar",
    title: "Spot the gaps before your audience does.",
  },
  {
    cta: "Connect your accounts",
    description:
      "Manage Instagram, TikTok, YouTube, LinkedIn, X, Facebook, and Threads from one workspace instead of rebuilding the same post in every native app.",
    image:
      "https://framerusercontent.com/images/l1CpF5EzDSCksVlxtEBU1RLqPI.png?scale-down-to=1024",
    subheading: "Seven social platforms",
    title: "Trade seven tabs for one workspace.",
  },
] as const;

export const featureItems = [
  {
    description:
      "Draft one post, then tailor the caption and settings for every channel without starting over.",
    heading: "One draft, seven channels",
    image:
      "https://framerusercontent.com/images/ll68lemaNuRB1V1tgDKcB0lgIMo.png",
  },
  {
    description:
      "See your month, week, day, or list at a glance. Drag any post to change its publish time.",
    heading: "Visual content calendar",
    image:
      "https://framerusercontent.com/images/k4FW0xmCR8OnVmCfHcN8UrLY0c.png?width=1788&height=960",
  },
  {
    description:
      "Schedule text, images, videos, Reels, Shorts, and Stories wherever each platform supports them.",
    heading: "Multi-platform scheduling",
    image:
      "https://framerusercontent.com/images/CMWCv1aJ3T8Q05vz4cSyjExE8s.png?scale-down-to=1024&width=1158&height=759",
  },
  {
    description:
      "Give everyone the same drafts, schedule, and post status so work stays visible without another check-in.",
    heading: "One calendar for the team",
    image:
      "https://framerusercontent.com/images/Jz9KleJLOcSD4s4U3Kjprs4Fx3s.png?scale-down-to=1024&width=1158&height=759",
  },
  {
    description:
      "Connect your social profiles once. Multi Feed encrypts account tokens and keeps each channel ready when you are.",
    heading: "Secure account connections",
    image:
      "https://framerusercontent.com/images/y25C7HJ1wHWV4u0DZaY5UmLwI.png?scale-down-to=1024&width=1158&height=759",
  },
] as const;

export const useCases = [
  {
    audience: "Creators",
    description:
      "Keep a steady publishing rhythm without spending your best creative hours inside scheduling tools.",
    icon: "ph:video-camera",
    title: "Protect your time to create",
  },
  {
    audience: "Founders",
    description:
      "Turn product updates, lessons, and launches into a clear schedule your whole team can see.",
    icon: "ph:rocket-launch",
    title: "Stay visible while building",
  },
  {
    audience: "Marketing teams",
    description:
      "Coordinate drafts, channel-specific copy, and publish times from one shared source of truth.",
    icon: "ph:users-three",
    title: "Keep every channel aligned",
  },
  {
    audience: "Agencies",
    description:
      "Manage high-volume client calendars without rebuilding the same workflow for every account.",
    icon: "ph:briefcase",
    title: "Give every client a clear plan",
  },
] as const;

const planBadges: Record<PlanKey, string> = {
  creator: "For solo work",
  growth: "Most popular",
  agency: "For scale",
};

export const pricingPlans = PLANS.map((plan) => ({
  badge: planBadges[plan.key],
  cta: `Start with ${plan.name}`,
  description: plan.description,
  features: plan.features,
  monthlyPrice: `$${plan.prices.month}`,
  name: plan.name,
  period: "/month",
  preferred: plan.key === "growth",
  yearlyPrice: `$${plan.prices.year}`,
}));
