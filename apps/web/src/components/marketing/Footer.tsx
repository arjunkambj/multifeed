import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";

import Logo from "@/components/layout/Logo";
import { policyLinks } from "@/components/marketing/policies/policy-links";

const footerLinks = [
  {
    links: [
      { href: "#features", name: "Features" },
      { href: "#pricing", name: "Pricing" },
    ],
    title: "Product",
  },
  {
    links: [
      { href: "#faq", name: "FAQ" },
      { href: "/sign-in", name: "Sign in" },
    ],
    title: "Resources",
  },
  {
    links: policyLinks,
    title: "Legal",
  },
] as const;

const socialLinks = [
  { href: "#", icon: "ph:x-logo", label: "X" },
  { href: "#", icon: "ph:instagram-logo", label: "Instagram" },
  { href: "#", icon: "ph:telegram-logo", label: "Telegram" },
] as const;

export function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl bg-background" data-gsap-section>
      <div
        className="flex flex-col items-center gap-4 border border-border bg-background px-6 py-16 text-center sm:px-10 sm:py-20"
        data-gsap-heading
      >
        <h3 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to trade seven tabs for one calendar?
        </h3>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          Create your post, tailor it for each platform, and schedule the whole
          week from one place.
        </p>
        <Link
          className={`${buttonVariants({ size: "lg" })} mt-2`}
          href="/sign-in"
        >
          Plan your first post
        </Link>
      </div>

      <div className="grid grid-cols-1 border-x border-border md:grid-cols-[1.1fr_1.7fr]">
        <div
          className="flex flex-col gap-3 px-4 py-10 sm:px-6 md:border-r md:border-border"
          data-gsap-card
        >
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Create, tailor, and schedule social posts across seven platforms
            from one visual calendar.
          </p>
          <div className="mt-2 flex gap-3">
            {socialLinks.map((social) => (
              <Link
                aria-label={social.label}
                className="text-muted-foreground transition-colors hover:text-primary"
                href={social.href}
                key={social.label}
              >
                <Icon icon={social.icon} width={20} />
              </Link>
            ))}
          </div>
        </div>

        <div
          className="grid grid-cols-2 gap-10 px-4 py-10 sm:px-6 md:pl-10 lg:grid-cols-3"
          data-gsap-card
        >
          {footerLinks.map((section) => (
            <div className="flex flex-col gap-4" key={section.title}>
              <h4 className="text-sm font-semibold">{section.title}</h4>
              <ul className="flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      href={link.href}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div
        className="flex flex-col items-start justify-between gap-4 border border-border px-4 py-6 sm:flex-row sm:items-center sm:px-6"
        data-gsap-card
      >
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} MultiFeed. All rights reserved.
        </p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <Link className="transition-colors hover:text-primary" href="/policies/privacy">
            Privacy
          </Link>
          <Link className="transition-colors hover:text-primary" href="/policies/terms">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
