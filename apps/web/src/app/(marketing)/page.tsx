import type { Metadata } from "next";
import { FAQ } from "@/components/marketing/FAQ";
import { Features } from "@/components/marketing/Feature";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Navbar } from "@/components/marketing/Navbar";
import { Pricing } from "@/components/marketing/Pricing";
import { ReadyCTA } from "@/components/marketing/ReadyCTA";
import { Testimonials } from "@/components/marketing/Testimonials";
import { WhyMultiFeed } from "@/components/marketing/WhyMultiFeed";

export const metadata: Metadata = {
  title: "MultiFeed | Plan and schedule social posts in one place",
  description:
    "Draft once, customize captions and formats natively for every channel, and schedule across Instagram, TikTok, LinkedIn, YouTube, X, and Facebook from one visual calendar.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MultiFeed | Plan once. Show up everywhere.",
    description:
      "Draft once, customize captions and formats natively for every channel, and schedule across six platforms from one visual calendar.",
    siteName: "MultiFeed",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "MultiFeed | Plan once. Show up everywhere.",
    description:
      "Draft once, customize captions and formats natively for every channel, and schedule across six platforms from one visual calendar.",
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
