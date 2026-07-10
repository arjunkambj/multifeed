import type { Metadata } from "next";

import { Hero } from "@/components/marketing/Hero";
import { Navbar } from "@/components/marketing/Navbar";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Footer } from "@/components/marketing/Footer";
import { FAQ } from "@/components/marketing/FAQ";
import { Features } from "@/components/marketing/Feature";
import { Testimonitals } from "@/components/marketing/Testimonial";
import { Pricing } from "@/components/marketing/Pricing";
import { MarketingMarquee } from "@/components/marketing/MarketingMarquee";
import { WhyUS } from "@/components/marketing/WhyUS";
import { MarketingAnimations } from "@/components/marketing/MarketingAnimations";

export const metadata: Metadata = {
  title: "Multi Feed | Run social on autopilot with AI agents",
  description:
    "Plan, generate, and schedule posts automatically to 30+ social networks — then review everything in a visual calendar. Use Claude, ChatGPT, Codex, Cursor, and more.",
  openGraph: {
    title: "Multi Feed | Run social on autopilot with AI agents",
    description:
      "Plan, generate, and schedule posts to 30+ networks with AI agents — then review and edit on a visual calendar.",
    siteName: "Multi Feed",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi Feed | Run social on autopilot with AI agents",
    description:
      "Plan, generate, and schedule posts to 30+ networks with AI agents — then review and edit on a visual calendar.",
  },
};

export default function Home() {
  return (
    <main className="marketing-landing flex w-full flex-col bg-background">
      <MarketingAnimations />
      <Navbar />
      <Hero />
      <MarketingMarquee />
      <Features />
      <WhyUS />
      <HowItWorks />
      <Testimonitals />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
