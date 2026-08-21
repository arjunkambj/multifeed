import type { Metadata } from "next";
import "../styles/globals.css";
import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { Bricolage_Grotesque, Figtree, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import { clientEnv } from "@/env";
import { hexclaveServerApp } from "@/hexclave/server";
import { cn } from "@/lib/utils";

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  applicationName: "MultiFeed",
  title: {
    default: "MultiFeed | Run social on autopilot with AI agents",
    template: "%s | MultiFeed",
  },
  description:
    "Plan, generate, and schedule posts automatically to 30+ social networks — then review everything in a visual calendar.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "MultiFeed | Run social on autopilot with AI agents",
    description:
      "Plan, generate, and schedule posts to 30+ networks with AI agents — then review and edit on a visual calendar.",
    siteName: "MultiFeed",
  },
  twitter: {
    card: "summary_large_image",
    title: "MultiFeed | Run social on autopilot with AI agents",
    description:
      "Plan, generate, and schedule posts to 30+ networks with AI agents — then review and edit on a visual calendar.",
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
      suppressHydrationWarning
    >
      <body className="font-sans">
        <HexclaveProvider app={hexclaveServerApp}>
          <HexclaveTheme>
            <Providers>{children}</Providers>
          </HexclaveTheme>
        </HexclaveProvider>
      </body>
    </html>
  );
}
