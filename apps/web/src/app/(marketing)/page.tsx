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

export const metadata: Metadata = {
  title: "Unifeed | Track Any Account Across All Socials",
  description:
    "Unifeed tracks all your creators, competitors, and campaigns across TikTok, Instagram, YouTube, and X — no passwords required.",
  openGraph: {
    title: "Unifeed | Track Any Account Across All Socials",
    description:
      "Unifeed tracks all your creators, competitors, and campaigns across TikTok, Instagram, YouTube, and X — no passwords required.",
    siteName: "Unifeed",
  },
  twitter: {
    card: "summary_large_image",
    title: "Unifeed | Track Any Account Across All Socials",
    description:
      "Unifeed tracks all your creators, competitors, and campaigns across TikTok, Instagram, YouTube, and X — no passwords required.",
  },
};

export default function Home() {
  return (
    <main className="motion-landing relative isolate flex w-full flex-col bg-background">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[calc(60dvh+18rem)] bg-[url('/mainbg.avif')] bg-cover bg-center bg-no-repeat dark:opacity-35" />
      <div className="relative z-10 flex flex-col">
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
      </div>
    </main>
  );
}
