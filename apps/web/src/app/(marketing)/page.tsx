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
  title: "Post to all your social accounts from one place",
  description:
    "Write a post, change the caption per platform, and schedule it for Instagram, TikTok, LinkedIn, YouTube, X, and Facebook.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "MultiFeed | Post to all your social accounts from one place",
    description:
      "Write a post, change the caption per platform, and schedule it for Instagram, TikTok, LinkedIn, YouTube, X, and Facebook.",
    siteName: "MultiFeed",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "MultiFeed | Post to all your social accounts from one place",
    description:
      "Write a post, change the caption per platform, and schedule it for Instagram, TikTok, LinkedIn, YouTube, X, and Facebook.",
  },
};

export default function Home() {
  return (
    <main className="flex w-full flex-col bg-background">
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
