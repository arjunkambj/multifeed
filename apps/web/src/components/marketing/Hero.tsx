"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Icon } from "@iconify/react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { DashboardMock } from "./DashboardMock";
import { PLATFORM_ICON, platforms } from "./rhythm";
import Section from "./Section";

const EASE = "easeOut" as const;

const stack: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
};

export function Hero() {
  const reduceMotion = useReducedMotion();

  const rise: Variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
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
              accounts from one place
            </span>
          </span>
        </motion.h1>

        <motion.p
          variants={rise}
          className="mx-auto mt-5 max-w-xl text-[1.0625rem] leading-8 text-pretty text-muted-foreground md:mt-6 md:text-[1.125rem]"
        >
          Write the post once. Change the caption if a platform needs it. Drop
          it on the calendar.
        </motion.p>

        <motion.div
          variants={rise}
          className="mt-9 flex flex-col items-center gap-5 md:mt-10 md:gap-6"
        >
          <Link
            href="/sign-in"
            className={`${buttonVariants({ size: "lg" })} w-full px-8 has-[svg]:gap-2 sm:w-auto [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5`}
          >
            Try it for free
            <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
          </Link>

          <div className="flex items-center justify-center">
            <div className="flex -space-x-2.5">
              {["PS", "ML", "AR", "TB", "JN"].map((initials) => (
                <span
                  className="inline-flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[0.625rem] font-medium text-muted-foreground"
                  key={initials}
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="ml-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">100+</span> people
              use it
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.18, ease: EASE }}
        className="relative mx-auto mt-16 w-full md:mt-20 lg:mt-24"
      >
        <div
          aria-label="MultiFeed calendar"
          className="relative w-full overflow-hidden rounded-panel"
          role="img"
        >
          <Image
            src="/hero-main.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1200px"
            className="object-cover object-center"
          />
          <div className="relative p-[6%]">
            <DashboardMock />
          </div>
        </div>
      </motion.div>
    </Section>
  );
}
