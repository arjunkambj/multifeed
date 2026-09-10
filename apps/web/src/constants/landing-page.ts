import { PLANS, type PlanKey } from "@multifeed/plans";

export const landingPeople = {
  priya: {
    name: "Priya Sharma",
    handle: "@priyabuilds",
    initials: "PS",
    src: "/avatars/priya.jpg",
  },
  marcus: {
    name: "Marcus Lee",
    handle: "@marcuslee",
    initials: "ML",
    src: "/avatars/marcus.jpg",
  },
  ana: {
    name: "Ana Rodrigues",
    handle: "@anarod",
    initials: "AR",
    src: "/avatars/ana.jpg",
  },
  tom: {
    name: "Tom Becker",
    handle: "@tbecker",
    initials: "TB",
    src: "/avatars/tom.jpg",
  },
  jess: {
    name: "Jess Nguyen",
    handle: "@jesswrites",
    initials: "JN",
    src: "/avatars/jess.jpg",
  },
  david: {
    name: "David Okafor",
    handle: "@dokafor",
    initials: "DO",
    src: "/avatars/david.jpg",
  },
  sofia: {
    name: "Sofia Marino",
    handle: "@sofiamarino",
    initials: "SM",
    src: "/avatars/sofia.jpg",
  },
  ryan: {
    name: "Ryan Whitfield",
    handle: "@ryanwhit",
    initials: "RW",
    src: "/avatars/ryan.jpg",
  },
  amara: {
    name: "Amara Diallo",
    handle: "@amaracreates",
    initials: "AD",
    src: "/avatars/amara.jpg",
  },
  maya: {
    name: "Maya Chen",
    handle: "@maya.studio",
    initials: "MC",
    src: "/avatars/maya.jpg",
  },
} as const;

export const socialProofPeople = [
  landingPeople.priya,
  landingPeople.marcus,
  landingPeople.ana,
  landingPeople.tom,
  landingPeople.jess,
] as const;

export const faqItems = [
  {
    content:
      "Sign in, connect an account, write a post, and pick a time. Adding more accounts takes a couple of minutes each.",
    title: "How do I get started?",
  },
  {
    content:
      "Instagram, TikTok, YouTube, LinkedIn, X, and Facebook Pages. Each one has its own post types, and we only show the ones it accepts.",
    title: "Which platforms can I post to?",
  },
  {
    content:
      "Yes. You start with one caption. Then you can change the text, first comment, alt text, and who can see it, per account.",
    title: "Can I use different captions on each platform?",
  },
  {
    content:
      "Text, photos, videos, and carousels. Reels, Shorts, and Stories where the platform allows them.",
    title: "What can I schedule?",
  },
  {
    content:
      "Yes. Month, week, day, and list views. Drag a post to a new time and it moves, in your timezone.",
    title: "Can I move a post after I schedule it?",
  },
] as const;

export const featureItems = [
  {
    ctaPrimary: "Start writing",
    mock: "overrides",
    description:
      "Write the post once. Give LinkedIn the long version, X the short one, TikTok a first comment. Same screen.",
    eyebrow: "Captions",
    heading: "Different text for each platform",
  },
  {
    ctaPrimary: "See the calendar",
    mock: "calendar",
    description:
      "Month, week, day, and list. Drag a post to a new time and it moves everywhere, in your timezone.",
    eyebrow: "Calendar",
    heading: "See the week. Drag a post to move it.",
  },
  {
    ctaPrimary: "Connect accounts",
    mock: "formats",
    description:
      "Reels, Shorts, Stories, carousels, regular posts. If Instagram doesn't take it, you won't see it.",
    eyebrow: "Formats",
    heading: "If it won't post, you won't see it",
  },
] as const;

const planBadges: Record<PlanKey, string> = {
  creator: "For one person",
  growth: "Most popular",
  agency: "For agencies",
};

export const pricingPlans = PLANS.map((plan) => ({
  badge: planBadges[plan.key],
  cta: "Get started",
  description: plan.description,
  features: plan.features,
  monthlyPrice: `$${plan.prices.month}`,
  name: plan.name,
  period: "/month",
  preferred: plan.key === "growth",
  yearlyPrice: `$${plan.prices.year}`,
}));
