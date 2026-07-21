import type { Metadata } from "next";

import { Hero } from "@/components/marketing/Hero";
import { Navbar } from "@/components/marketing/Navbar";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { Footer } from "@/components/marketing/Footer";
import { FAQ } from "@/components/marketing/FAQ";
import { Features } from "@/components/marketing/Feature";
import { Pricing } from "@/components/marketing/Pricing";
import { MarketingMarquee } from "@/components/marketing/MarketingMarquee";
import { WhyUS } from "@/components/marketing/WhyUS";
import { MarketingAnimations } from "@/components/marketing/MarketingAnimations";
import { UseCases } from "@/components/marketing/UseCases";

export const metadata: Metadata = {
  title: "Multi Feed | Plan and schedule social posts in one place",
  description:
    "Create, tailor, and schedule posts for Instagram, TikTok, YouTube, LinkedIn, X, Facebook, and Threads from one visual content calendar.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Multi Feed | Plan once. Show up everywhere.",
    description:
      "Create, tailor, and schedule social posts across seven platforms from one visual calendar.",
    siteName: "Multi Feed",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Multi Feed | Plan once. Show up everywhere.",
    description:
      "Create, tailor, and schedule social posts across seven platforms from one visual calendar.",
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
      <UseCases />
      <Pricing />
      <FAQ />
      <Footer />
    </main>
  );
}
