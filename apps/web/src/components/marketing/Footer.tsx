"use client";

import { buttonVariants } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

import Logo from "@/components/layout/Logo";

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
    links: [
      { href: "#terms", name: "Terms" },
      { href: "#privacy", name: "Privacy" },
    ],
    title: "Legal",
  },
] as const;

const socialLinks = [
  { href: "#", icon: "ph:x-logo", label: "X" },
  { href: "#", icon: "ph:instagram-logo", label: "Instagram" },
  { href: "#", icon: "ph:telegram-logo", label: "Telegram" },
] as const;

function FooterCTA() {
  return (
    <div
      className="marketing-surface relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-4 overflow-hidden border border-border bg-surface/80 px-6 py-16 text-center sm:px-10 sm:py-20"
      data-gsap-section
    >
      <div className="contents" data-gsap-heading>
        <h3 className="relative font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to run social on autopilot?
        </h3>
        <p className="relative max-w-xl text-base text-muted sm:text-lg">
          Point your AI agents at Multi Feed, review on the calendar, and publish
          to 30+ networks — free for 7 days.
        </p>
        <div>
          <Link
            className={`${buttonVariants({ size: "lg" })} button mt-2`}
            href="/sign-in"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </div>
  );
}

export function Footer() {
  return (
    <div className="flex flex-col gap-12 px-4 pb-0 pt-12 sm:px-6 md:gap-16 md:pt-16">
      <FooterCTA />
      <footer className="w-full bg-background">
        <div
          className="mx-auto w-full max-w-7xl py-12 sm:py-16"
          data-gsap-section
        >
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-12">
            {footerLinks.map((section) => (
              <div
                className="flex flex-col gap-4"
                data-gsap-card
                key={section.title}
              >
                <h4 className="text-sm font-semibold">{section.title}</h4>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        className="text-sm text-muted transition-colors hover:text-accent"
                        href={link.href}
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex flex-col gap-4" data-gsap-card>
              <h4 className="text-sm font-semibold">Stay connected</h4>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <Link
                    aria-label={social.label}
                    className="text-muted transition-colors hover:text-accent"
                    href={social.href}
                    key={social.label}
                  >
                    <Icon icon={social.icon} width={20} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div
            className="mt-12 border-t border-border sm:mt-16"
            data-gsap-card
          />

          <div
            className="mt-8 flex flex-col items-start justify-between gap-6 sm:mt-10 sm:flex-row sm:items-end"
            data-gsap-card
          >
            <div className="flex max-w-xs flex-col gap-3">
              <Logo />
              <p className="text-sm leading-relaxed text-muted">
                Run social on autopilot with AI agents — plan, generate, and
                schedule to 30+ networks from one visual calendar.
              </p>
            </div>
            <p className="text-xs text-muted">
              &copy; {new Date().getFullYear()} Multi Feed. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
