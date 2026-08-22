import { Icon } from "@iconify/react";
import Logo from "@/components/layout/Logo";
import { policyLinks } from "@/components/marketing/policies/policy-links";
import Reveal from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import { BODY } from "./rhythm";

type FooterLink = { label: string; href: string };

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
      { label: "Sign in", href: "/sign-in" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Testimonials", href: "#reviews" },
      { label: "FAQ", href: "#faq" },
      { label: "Support", href: "mailto:support@themultifeed.com" },
    ],
  },
  {
    title: "Legal",
    links: legal,
  },
];

const socials = [
  {
    label: "X (Twitter)",
    icon: "fa6-brands:x-twitter",
    href: "https://x.com/themultifeed",
  },
  {
    label: "Instagram",
    icon: "fa6-brands:instagram",
    href: "https://instagram.com/themultifeed",
  },
  {
    label: "Telegram",
    icon: "fa6-brands:telegram",
    href: "https://t.me/themultifeed",
  },
];

export function Footer() {
  return (
    <footer className="min-w-0 scroll-mt-20 border-t bg-background">
      <div className="mx-auto w-full max-w-7xl px-5 pt-12 pb-12 sm:px-6 lg:px-8 lg:pt-16">
        {/* Brand column + three link columns on one row (desktop). */}
        <div
          className={cn(
            "grid grid-cols-1 gap-x-8 gap-y-12",
            "sm:grid-cols-[repeat(2,minmax(0,1fr))] lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))] lg:gap-x-12",
          )}
        >
          <Reveal className="max-w-sm">
            <Logo />
            <p className={`mt-4 text-muted-foreground ${BODY}`}>
              Create, tailor, and schedule social posts across seven platforms
              from one visual calendar.
            </p>
            <ul className="mt-6 flex items-center gap-4">
              {socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Icon icon={social.icon} width="18" height="18" />
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          {sections.map((section, idx) => (
            <Reveal
              key={section.title}
              delay={idx * 0.05}
              className="lg:justify-self-end"
            >
              <h3 className="text-[0.9375rem] font-semibold tracking-tight text-foreground">
                {section.title}
              </h3>
              <ul className={cn("mt-5 space-y-3", BODY)}>
                {section.links.map((link) => (
                  <li key={link.label} className="break-inside-avoid">
                    <a
                      href={link.href}
                      {...(link.href.startsWith("http")
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="inline-block rounded-sm text-muted-foreground transition-colors duration-200 hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>

        {/* Bottom bar — copyright only, keeps the close quiet. */}
        <Reveal className="mt-14 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MultiFeed. All rights reserved.</p>
          <p>
            Built for creators who publish{" "}
            <span className="text-foreground">everywhere</span>.
          </p>
        </Reveal>
      </div>
    </footer>
  );
}
