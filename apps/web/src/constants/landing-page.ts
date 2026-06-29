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
  [
    "Shopify",
    "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg",
  ],
  [
    "Stripe",
    "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg",
  ],
] as const;

export const faqItems = [
  {
    content:
      "Add the public profiles you want to track and Unifeed keeps their posts, videos, engagement, links, and campaign history in one place.",
    title: "How does Unifeed track creators?",
  },
  {
    content:
      "No. Unifeed tracks public social activity and campaign assets without asking creators for passwords.",
    title: "Do creators need to share account access?",
  },
  {
    content:
      "Use branded short links per creator, post, or campaign to see click-throughs, conversions, and revenue attribution.",
    title: "Can I attribute sales to creator posts?",
  },
  {
    content:
      "Yes. Invite teammates, assign campaigns, manage contracts, and keep creator records synced across your workspace.",
    title: "Can my team collaborate in Unifeed?",
  },
  {
    content:
      "Tracked accounts refresh automatically, with faster refresh windows on higher-volume plans.",
    title: "How fresh is the data?",
  },
  {
    content:
      "Yes. Unifeed is built for brands, agencies, and operators managing creators across multiple social channels.",
    title: "Is this for agencies too?",
  },
] as const;

export const whyUsPoints = [
  {
    cta: "Start tracking",
    description:
      "Track views, likes, comments, shares, and engagement across TikTok, Instagram, YouTube, and X without jumping between tabs.",
    image:
      "https://framerusercontent.com/images/l1CpF5EzDSCksVlxtEBU1RLqPI.png?scale-down-to=1024",
    subheading: "Analytics",
    title: "All your creators, one dashboard.",
  },
  {
    cta: "View attribution",
    description:
      "Generate branded short links for every creator post and connect clicks, conversions, and revenue back to the campaign.",
    image:
      "https://framerusercontent.com/images/veTFqarPod5nyzjlnsyKI6W1o.png?scale-down-to=1024&width=1936&height=1680",
    subheading: "Attribution",
    title: "Track clicks. Attribute revenue.",
  },
  {
    cta: "Manage contracts",
    description:
      "Create creator contracts from templates, send signing links, and track status from draft to fully signed.",
    image:
      "https://framerusercontent.com/images/l1CpF5EzDSCksVlxtEBU1RLqPI.png?scale-down-to=1024",
    subheading: "Contracts",
    title: "Contracts, built in.",
  },
] as const;

export const featureItems = [
  {
    description:
      "See account growth, post performance, engagement rate, and campaign lift across every channel you monitor.",
    heading: "Smart Analytics",
    image:
      "https://framerusercontent.com/images/ll68lemaNuRB1V1tgDKcB0lgIMo.png",
  },
  {
    description:
      "Create trackable links, organize launches, and keep every campaign touchpoint connected to the right creator.",
    heading: "Campaign Workflows",
    image:
      "https://framerusercontent.com/images/k4FW0xmCR8OnVmCfHcN8UrLY0c.png?width=1788&height=960",
  },
  {
    description:
      "Shared workspaces, role-based access, and clean creator records help your team move without duplicate spreadsheets.",
    heading: "Team Collaboration",
    image:
      "https://framerusercontent.com/images/CMWCv1aJ3T8Q05vz4cSyjExE8s.png?scale-down-to=1024&width=1158&height=759",
  },
  {
    description:
      "Connect creator activity to the tools your team already uses for commerce, analytics, reporting, and payments.",
    heading: "Integrations",
    image:
      "https://framerusercontent.com/images/Jz9KleJLOcSD4s4U3Kjprs4Fx3s.png?scale-down-to=1024&width=1158&height=759",
  },
  {
    description:
      "Centralized access and structured campaign records keep creator operations clean as your program scales.",
    heading: "Operational Control",
    image:
      "https://framerusercontent.com/images/y25C7HJ1wHWV4u0DZaY5UmLwI.png?scale-down-to=1024&width=1158&height=759",
  },
] as const;

export const testimonials = [
  {
    avatar: "https://i.pravatar.cc/150?u=amina",
    name: "Amina Patel",
    quote:
      "Unifeed replaced the spreadsheet we were terrified to touch. Every creator campaign is finally trackable.",
    role: "Head of Growth, Northstar Labs",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=daniel",
    name: "Daniel Ruiz",
    quote:
      "The attribution view changed how we renew creators. We can see exactly which posts are driving action.",
    role: "Founder, Fieldhouse",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=sarah",
    name: "Sarah Thompson",
    quote:
      "Our team moved from screenshots and Slack threads to one shared source of truth in the first week.",
    role: "Creator Partnerships, Loop",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=james",
    name: "James Carter",
    quote:
      "Tracking public social performance without asking creators for passwords made onboarding so much easier.",
    role: "Agency Director, Apex Social",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=emily",
    name: "Emily Chen",
    quote:
      "Contracts, links, and performance live together now. That alone saves us hours every launch.",
    role: "CEO, Brightline",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=michael",
    name: "Michael Brown",
    quote:
      "The dashboard makes it obvious which creators deserve more budget and which campaigns need attention.",
    role: "Performance Lead, Grove",
  },
] as const;

export const pricingPlans = [
  {
    cta: "Get Started",
    description:
      "Perfect for small teams and individual creators getting started.",
    features: [
      "Unlimited tracked accounts",
      "Up to 150 videos",
      "24-hour data refresh",
      "Creator portals",
      "Contract management",
      "2 team seats",
    ],
    monthlyPrice: "$49",
    name: "Starter",
    period: "/month",
    yearlyPrice: "$39",
  },
  {
    cta: "Get Started",
    description: "For growing brands scaling creator campaigns.",
    features: [
      "Everything in Starter",
      "Up to 1,000 videos",
      "Revenue tracking and attribution",
      "Creator campaigns",
      "5 team seats",
      "Priority support",
    ],
    monthlyPrice: "$99",
    name: "Pro",
    period: "/month",
    yearlyPrice: "$79",
  },
  {
    cta: "Contact Sales",
    description: "For agencies and large teams with high-volume needs.",
    features: [
      "Everything in Pro",
      "Up to 5,000 videos",
      "12-hour data refresh",
      "15 team seats",
      "API access",
      "Dedicated account manager",
    ],
    monthlyPrice: "$299",
    name: "Ultra",
    period: "/month",
    yearlyPrice: "$239",
  },
] as const;
