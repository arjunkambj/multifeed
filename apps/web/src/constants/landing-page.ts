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
      "Connect your networks, point an AI agent at Multi Feed, and start generating and scheduling. Most teams ship their first week of posts in under ten minutes.",
    title: "How fast can I get on autopilot?",
  },
  {
    content:
      "30+ social networks — including TikTok, Instagram, YouTube, X, LinkedIn, and more — with per-platform captions when you need them.",
    title: "Which platforms are supported?",
  },
  {
    content:
      "Yes. Bring Claude, ChatGPT, Codex, Cursor, OpenClaw, Hermes, or any agent that can call your workspace. Multi Feed is the layer that plans, schedules, and publishes.",
    title: "Can I use my own AI agents?",
  },
  {
    content:
      "Agents draft and queue. You stay in control with a visual calendar to review, edit, reschedule, or kill anything before it goes live.",
    title: "Do I still review posts before they publish?",
  },
  {
    content:
      "Yes. Every plan includes a 7-day free trial. Cancel anytime before it ends and you won’t be charged.",
    title: "Is there a free trial?",
  },
  {
    content:
      "Creators, founders, and agencies all run Multi Feed — solo operators on autopilot and teams sharing one calendar.",
    title: "Is this only for solo creators?",
  },
] as const;

export const whyUsPoints = [
  {
    cta: "Meet the agents",
    description:
      "Point Claude, ChatGPT, Codex, Cursor, or your own stack at Multi Feed. Agents plan and generate; you keep the final say.",
    image:
      "https://framerusercontent.com/images/l1CpF5EzDSCksVlxtEBU1RLqPI.png?scale-down-to=1024",
    subheading: "AI agents",
    title: "Autopilot that still feels like you.",
  },
  {
    cta: "Open the calendar",
    description:
      "Every draft lands on a visual calendar. Drag, edit, or pause before it hits 30+ networks — no surprise posts.",
    image:
      "https://framerusercontent.com/images/veTFqarPod5nyzjlnsyKI6W1o.png?scale-down-to=1024&width=1936&height=1680",
    subheading: "Visual calendar",
    title: "Review everything before it ships.",
  },
  {
    cta: "Connect networks",
    description:
      "One workspace for every channel you care about. Schedule once, publish everywhere, stop living in native apps.",
    image:
      "https://framerusercontent.com/images/l1CpF5EzDSCksVlxtEBU1RLqPI.png?scale-down-to=1024",
    subheading: "30+ networks",
    title: "One feed. Every platform.",
  },
] as const;

export const featureItems = [
  {
    description:
      "Plan, generate, and queue posts with the agents you already use — Claude, ChatGPT, Codex, Cursor, and more.",
    heading: "AI agent autopilot",
    image:
      "https://framerusercontent.com/images/ll68lemaNuRB1V1tgDKcB0lgIMo.png",
  },
  {
    description:
      "See the week at a glance. Review, edit, and reschedule everything before it goes live.",
    heading: "Visual content calendar",
    image:
      "https://framerusercontent.com/images/k4FW0xmCR8OnVmCfHcN8UrLY0c.png?width=1788&height=960",
  },
  {
    description:
      "Publish to 30+ social networks from one place, with captions that still feel native per channel.",
    heading: "Multi-network publishing",
    image:
      "https://framerusercontent.com/images/CMWCv1aJ3T8Q05vz4cSyjExE8s.png?scale-down-to=1024&width=1158&height=759",
  },
  {
    description:
      "Shared drafts and one calendar so founders, creators, and agencies stay aligned without Slack chaos.",
    heading: "Team workflows",
    image:
      "https://framerusercontent.com/images/Jz9KleJLOcSD4s4U3Kjprs4Fx3s.png?scale-down-to=1024&width=1158&height=759",
  },
  {
    description:
      "Connect accounts once and let agents + your calendar keep the cadence — without a new stack to learn.",
    heading: "Account connections",
    image:
      "https://framerusercontent.com/images/y25C7HJ1wHWV4u0DZaY5UmLwI.png?scale-down-to=1024&width=1158&height=759",
  },
] as const;

export const testimonials = [
  {
    avatar: "https://i.pravatar.cc/150?u=amina",
    name: "Amina Patel",
    quote:
      "My agent drafts the week; I just polish on the calendar. Social finally runs without eating my mornings.",
    role: "Creator, Northstar",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=daniel",
    name: "Daniel Ruiz",
    quote:
      "We pointed Claude at Multi Feed and the calendar filled itself. Reviewing posts is minutes, not hours.",
    role: "Founder, Fieldhouse",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=sarah",
    name: "Sarah Thompson",
    quote:
      "One visual calendar for every network. The team stopped asking “did we post?” in the group chat.",
    role: "Social Lead, Loop",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=james",
    name: "James Carter",
    quote:
      "Clients want coverage on 15+ platforms. Agents + Multi Feed is how we deliver without another hire.",
    role: "Agency Director, Apex Social",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=emily",
    name: "Emily Chen",
    quote:
      "I keep Cursor for drafts and Multi Feed for publish. Autopilot with an edit button — that’s the unlock.",
    role: "CEO, Brightline",
  },
  {
    avatar: "https://i.pravatar.cc/150?u=michael",
    name: "Michael Brown",
    quote:
      "Schedule once, hit every network, still approve on the calendar. That’s how growth should feel.",
    role: "Growth Lead, Grove",
  },
] as const;

export const pricingPlans = [
  {
    badge: "Most popular",
    cta: "Start 7-day free trial",
    description:
      "Best for solo operators running AI agents across core channels.",
    features: [
      "15 connected social accounts",
      "AI agent–ready scheduling",
      "Visual content calendar",
      "Multi-network publishing",
      "Platform caption overrides",
      "Basic analytics refresh",
      "2 team seats",
    ],
    monthlyPrice: "$29",
    name: "Creator",
    period: "/month",
    preferred: false,
    yearlyPrice: "$23",
  },
  {
    badge: "Best value",
    cta: "Start 7-day free trial",
    description:
      "Best for teams running agents + shared calendars across brands.",
    features: [
      "50 connected social accounts",
      "Everything in Creator",
      "Calendar and status views",
      "Shared inbox",
      "Advanced analytics history",
      "Priority metric refresh",
      "5 team seats",
    ],
    monthlyPrice: "$59",
    name: "Growth",
    period: "/month",
    yearlyPrice: "$47",
    preferred: true,
  },
  {
    badge: "Scale ready",
    cta: "Start 7-day free trial",
    description:
      "Best for agencies shipping high volume across 30+ networks.",
    features: [
      "Unlimited connected accounts",
      "Everything in Growth",
      "Bulk video scheduling",
      "Approval-ready team workflows",
      "API / agent add-on",
      "Priority support",
      "15 team seats",
    ],
    monthlyPrice: "$119",
    name: "Agency",
    period: "/month",
    preferred: false,
    yearlyPrice: "$95",
  },
] as const;
