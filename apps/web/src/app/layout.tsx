import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "../styles/globals.css";
import { Bricolage_Grotesque, Figtree, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import { clientEnv } from "@/env";
import { cn } from "@/lib/utils";

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});

const fontFamilies = {
  "--font-heading": figtreeHeading.style.fontFamily,
  "--font-display": bricolage.style.fontFamily,
  "--font-sans": inter.style.fontFamily,
} as CSSProperties;

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  applicationName: "MultiFeed",
  title: {
    default: "Post to all your social accounts from one place",
    template: "%s | MultiFeed",
  },
  description:
    "Write a post, change the caption per platform, and schedule it for Instagram, TikTok, LinkedIn, YouTube, X, and Facebook.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "MultiFeed | Post to all your social accounts from one place",
    description:
      "Write a post, change the caption per platform, and schedule it for Instagram, TikTok, LinkedIn, YouTube, X, and Facebook.",
    siteName: "MultiFeed",
  },
  twitter: {
    card: "summary_large_image",
    title: "MultiFeed | Post to all your social accounts from one place",
    description:
      "Write a post, change the caption per platform, and schedule it for Instagram, TikTok, LinkedIn, YouTube, X, and Facebook.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        bricolage.variable,
        figtreeHeading.variable,
        "font-sans",
        inter.variable,
      )}
      style={fontFamilies}
      suppressHydrationWarning
    >
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
