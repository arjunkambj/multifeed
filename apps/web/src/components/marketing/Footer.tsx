import { Icon } from "@iconify/react";

import Logo from "@/components/layout/Logo";
import Reveal from "@/components/motion/Reveal";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import { policyLinks } from "@/components/marketing/policies/policy-links";
import { BODY, HEADER_GAP } from "./rhythm";

type FooterLink = { label: string; href: string };

const socials = [
  { label: "Twitter/X", href: "#", icon: "simple-icons:x" },
  { label: "Instagram", href: "#", icon: "simple-icons:instagram" },
  { label: "TikTok", href: "#", icon: "simple-icons:tiktok" },
  { label: "YouTube", href: "#", icon: "simple-icons:youtube" },
];

const legal: FooterLink[] = policyLinks.map((link) => ({
  label: link.name,
  href: link.href,
}));

const sections: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Testimonials", href: "#reviews" },
      { label: "FAQ", href: "#faq" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
  {
    title: "Platforms",
    links: [
      { label: "Instagram scheduler", href: "#" },
      { label: "TikTok scheduler", href: "#" },
      { label: "YouTube scheduler", href: "#" },
      { label: "LinkedIn scheduler", href: "#" },
      { label: "X / Twitter scheduler", href: "#" },
      { label: "Facebook scheduler", href: "#" },
      { label: "Threads scheduler", href: "#" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Support", href: "mailto:support@themultifeed.com" },
      { label: "Privacy policy", href: "/policies/privacy" },
      { label: "Terms of service", href: "/policies/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="min-w-0 scroll-mt-20 border-t bg-background">
      {/* Same gutters as Section, and the section padding scale one step down —
          the footer closes the page, it doesn't open a new one. */}
      <div className="mx-auto w-full max-w-7xl px-5 pt-16 pb-12 sm:px-6 lg:px-8 lg:pt-24">
        {/* Row 1 — about + social */}
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <Logo />
            <p className={`mt-4 text-muted-foreground ${BODY}`}>
              Create, tailor, and schedule social posts across seven platforms
              from one visual calendar.
            </p>
          </div>

          <div className="md:text-right">
            <h3 className="font-sans text-[0.8125rem] leading-5 font-semibold text-foreground">
              Follow along
            </h3>
            <ul className="-mx-1 mt-4 flex flex-wrap items-center gap-2 md:justify-end">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    title={social.label}
                    className="flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Icon icon={social.icon} width={18} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        {/* Row 2 — link grid */}
        <nav
          aria-label="Footer"
          className={cn(
            HEADER_GAP,
            "grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 lg:grid-cols-[repeat(3,max-content)] lg:justify-between lg:gap-x-12",
          )}
        >
          {sections.map((section, idx) => (
            <Reveal key={section.title} delay={idx * 0.06}>
              <h3 className="font-sans text-[0.8125rem] leading-5 font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label} className="break-inside-avoid">
                    <a
                      href={link.href}
                      className="inline-block rounded-sm text-[0.8125rem] leading-5 text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </nav>

        <Reveal>
          <Separator className="mt-12 mb-6 opacity-50" />
        </Reveal>

        {/* Row 3 — legal + copyright */}
        <Reveal className="flex flex-col gap-4 text-xs leading-5 text-muted-foreground md:flex-row-reverse md:items-center md:justify-between">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {legal.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="inline-block rounded-sm transition-colors duration-200 hover:text-foreground"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <p>© {new Date().getFullYear()} MultiFeed. All rights reserved.</p>
        </Reveal>
      </div>
    </footer>
  );
}
