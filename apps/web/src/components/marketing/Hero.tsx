"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Icon } from "@iconify/react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { PLATFORM_ICON, platforms } from "./rhythm";
import Section from "./Section";

const EASE = "easeOut" as const;

const stack: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export function Hero() {
  const reduceMotion = useReducedMotion();

  const rise: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
  };

  return (
    <Section
      id="hero"
      className="overflow-hidden"
      containerClassName="relative"
    >
      <motion.div
        initial="hidden"
        animate="show"
        variants={stack}
        className="relative mx-auto w-full min-w-0 max-w-5xl text-center"
      >
        {/* Platform icons — flat, no card/border */}
        <motion.div
          variants={rise}
          className="flex flex-wrap items-center justify-center gap-3.5 md:gap-4"
        >
          {platforms.map((p) => (
            <span
              key={p.label}
              aria-label={p.label}
              title={p.label}
              className="inline-flex cursor-pointer items-center justify-center opacity-90 transition-all duration-200 hover:scale-110 hover:opacity-100"
            >
              <Icon
                icon={p.icon}
                className={PLATFORM_ICON}
                style={{ color: p.color }}
              />
            </span>
          ))}
        </motion.div>

        <motion.h1
          variants={rise}
          className="font-heading mx-auto mt-6 w-full min-w-0 max-w-4xl text-[2.375rem] leading-[1.04] font-semibold tracking-[-0.035em] text-pretty text-foreground sm:text-[3rem] sm:text-balance md:mt-7 md:max-w-none md:text-[3.5rem] md:leading-[1.02] lg:text-6xl xl:text-[4.375rem]"
        >
          Post to all your social
          <span className="block sm:whitespace-nowrap">
            <span className="font-normal text-muted-foreground">
              accounts from one calendar
            </span>
          </span>
        </motion.h1>

        <motion.p
          variants={rise}
          className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-8 text-pretty text-muted-foreground md:mt-6 md:text-[1.125rem]"
        >
          Draft your content once, fine-tune native captions and formats for
          every channel, and schedule weeks of posts across seven platforms —
          without switching tabs.
        </motion.p>

        <motion.div
          variants={rise}
          className="mt-9 flex justify-center md:mt-10"
        >
          <Link
            href="/sign-in"
            className={`${buttonVariants({ size: "lg" })} w-full rounded-full px-8 has-[svg]:gap-2 sm:w-auto [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5`}
          >
            Start publishing
            <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
          </Link>
        </motion.div>

        {/* Trust line — the hero's closing beat */}
        <motion.div
          variants={rise}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Icon className="text-primary" icon="lucide:check" width={14} />
            Cancel anytime
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Icon className="text-primary" icon="lucide:check" width={14} />
            Simple monthly or yearly billing
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Icon className="text-primary" icon="lucide:check" width={14} />
            Connect all 7 channels
          </span>
        </motion.div>
      </motion.div>

      {/* Product screenshot on a panel canvas */}
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
        className="relative mx-auto mt-16 w-full md:mt-20 lg:mt-24"
      >
        <div className="relative overflow-hidden rounded-panel bg-secondary px-4 py-8 sm:px-8 sm:py-10 md:px-12 md:py-12 lg:px-16 lg:py-16 xl:px-20 xl:pt-20 xl:pb-10">
          <div className="relative min-w-0 overflow-hidden rounded-card border border-border/50 bg-card shadow-[0_24px_64px_-20px_rgba(24,24,27,0.35)] md:rounded-panel lg:rounded-[1.75rem]">
            <Image
              src="/hero-main.png"
              alt="MultiFeed visual content calendar"
              width={1672}
              height={941}
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
