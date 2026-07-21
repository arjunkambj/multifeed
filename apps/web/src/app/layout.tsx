import type { Metadata } from "next";
import "../styles/globals.css";
import Providers from "@/components/Providers";
import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveServerApp } from "@/hexclave/server";
import { Bricolage_Grotesque, Inter, Figtree } from "next/font/google";

const figtreeHeading = Figtree({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://themultifeed.com"),
  applicationName: "Multi Feed",
  title: "Multi Feed | Run social on autopilot with AI agents",
  description:
    "Plan, generate, and schedule posts automatically to 30+ social networks — then review everything in a visual calendar.",
  icons: {
    icon: "/icon.svg",
  },
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} font-sans ${inter.variable} ${figtreeHeading.variable}`}
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
