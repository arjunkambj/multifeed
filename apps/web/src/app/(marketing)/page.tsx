import type { Metadata } from "next";

import { Hero } from "@/components/marketing/Hero";
import { Navbar } from "@/components/marketing/Navbar";
import { Features } from "@/components/marketing/Feature";
import { WhyMultiFeed } from "@/components/marketing/WhyMultiFeed";
import { Testimonials } from "@/components/marketing/Testimonials";
import { Pricing } from "@/components/marketing/Pricing";
import { Footer } from "@/components/marketing/Footer";
import { FAQ } from "@/components/marketing/FAQ";
import { ReadyCTA } from "@/components/marketing/ReadyCTA";

export const metadata: Metadata = {
  title: "MultiFeed | Plan and schedule social posts in one place",
  description:
    "Draft once, customize captions and formats natively for every channel, and schedule across Instagram, TikTok, LinkedIn, YouTube, X, Facebook, and Threads from one visual calendar.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MultiFeed | Plan once. Show up everywhere.",
    description:
      "Draft once, customize captions and formats natively for every channel, and schedule across seven platforms from one visual calendar.",
    siteName: "MultiFeed",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "MultiFeed | Plan once. Show up everywhere.",
    description:
      "Draft once, customize captions and formats natively for every channel, and schedule across seven platforms from one visual calendar.",
  },
};

export default function Home() {
  return (
    <main className="marketing-landing flex w-full flex-col bg-background">
      <Navbar />
      <Hero />
      <WhyMultiFeed />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <ReadyCTA />
      <Footer />
    </main>
  );
}
