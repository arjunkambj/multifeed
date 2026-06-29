"use client";

import { buttonVariants } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import Link from "next/link";

import Logo from "@/components/layout/Logo";
import {
  revealCardVariants,
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from "@/components/marketing/motion-variants";

const footerLinks = [
  {
    links: [
      { href: "#features", name: "Features" },
      { href: "#pricing", name: "Pricing" },
    ],
    title: "Company",
  },
  {
    links: [
      { href: "#faq", name: "FAQ" },
      { href: "/overview", name: "Overview" },
    ],
    title: "Resources",
  },
  {
    links: [
      { href: "#terms", name: "Terms" },
      { href: "#privacy", name: "Privacy Policy" },
    ],
    title: "Legal",
  },
] as const;

const socialLinks = [
  { href: "#", icon: "ph:x-logo", label: "X" },
  { href: "#", icon: "ph:instagram-logo", label: "Instagram" },
  { href: "#", icon: "ph:telegram-logo", label: "Telegram" },
] as const;

export function FooterCTA() {
  return (
    <motion.div
      className="relative mx-auto flex w-full max-w-7xl flex-col items-center justify-center gap-3 overflow-hidden rounded-[2rem] bg-surface-secondary px-6 py-20 text-center md:px-12"
      initial="initial"
      variants={revealContainerVariants}
      viewport={revealViewport}
      whileInView="animate"
    >
      <motion.h3
        className="relative text-4xl font-bold"
        variants={revealItemVariants}
      >
        Ready to track your next creator campaign?
      </motion.h3>
      <motion.p
        className="relative max-w-xl text-lg text-muted"
        variants={revealItemVariants}
      >
        Bring performance, attribution, contracts, and reporting into one
        workspace.
      </motion.p>
      <motion.div variants={revealItemVariants}>
        <Link
          className={`${buttonVariants({ size: "lg" })} mt-4`}
          href="/sign-in"
        >
          Get Started
        </Link>
      </motion.div>
    </motion.div>
  );
}

export function Footer() {
  return (
    <div className="flex flex-col gap-18 px-4 pt-24">
      <FooterCTA />
      <footer className="w-full bg-background">
        <motion.div
          className="mx-auto max-w-7xl px-2 py-16 sm:px-6"
          initial="initial"
          variants={revealContainerVariants}
          viewport={revealViewport}
          whileInView="animate"
        >
          <motion.div
            className="grid grid-cols-2 gap-12 md:grid-cols-4"
            variants={revealContainerVariants}
          >
            {footerLinks.map((section) => (
              <motion.div
                className="flex flex-col gap-4"
                key={section.title}
                variants={revealCardVariants}
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
              </motion.div>
            ))}

            <motion.div
              className="flex flex-col gap-4"
              variants={revealCardVariants}
            >
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
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-16 border-t border-border"
            variants={revealItemVariants}
          />

          <motion.div
            className="mt-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end"
            variants={revealContainerVariants}
          >
            <div className="flex max-w-xs flex-col gap-3">
              <Logo />
              <p className="text-sm text-muted">
                Creator campaign intelligence for brands, agencies, and teams
                scaling social partnerships.
              </p>
            </div>
            <p className="text-xs text-muted">
              &copy; {new Date().getFullYear()} Unifeed. All rights reserved.
            </p>
          </motion.div>
        </motion.div>
      </footer>
    </div>
  );
}
