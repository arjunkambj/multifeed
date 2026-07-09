"use client";

import { buttonVariants, Switch } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

import { pricingPlans } from "@/constants/landing-page";
import {
  revealCardVariants,
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from "@/components/marketing/motion-variants";

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24"
      id="pricing"
    >
      <motion.div
        className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        <motion.span
          className="text-sm font-semibold uppercase tracking-wide text-accent"
          variants={revealItemVariants}
        >
          Pricing
        </motion.span>
        <motion.h2
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
          variants={revealItemVariants}
        >
          Simple pricing. Start free for 7 days.
        </motion.h2>
        <motion.p
          className="text-base leading-relaxed text-muted sm:text-lg"
          variants={revealItemVariants}
        >
          Pick a plan for how many networks and agents you run — upgrade when
          autopilot needs more room.
        </motion.p>
        <motion.div
          className="marketing-control mt-2 flex items-center gap-1 border border-border/50 bg-surface px-1.5 py-1"
          role="group"
          variants={revealItemVariants}
        >
          <button
            className={`marketing-control-item cursor-pointer px-2.5 py-1 text-sm font-medium transition-colors ${
              !isYearly ? "bg-surface-secondary text-foreground" : "text-muted hover:text-foreground"
            }`}
            onClick={() => setIsYearly(false)}
            type="button"
          >
            Monthly
          </button>
          <Switch isSelected={isYearly} onChange={setIsYearly}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
          <button
            className={`marketing-control-item cursor-pointer px-2.5 py-1 text-sm font-medium transition-colors ${
              isYearly ? "bg-surface-secondary text-foreground" : "text-muted hover:text-foreground"
            }`}
            onClick={() => setIsYearly(true)}
            type="button"
          >
            Yearly
            <span className="text-xs text-accent"> · Save 20%</span>
          </button>
        </motion.div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:gap-5"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        {pricingPlans.map((plan) => (
          <motion.div
            className="h-full"
            key={plan.name}
            variants={revealCardVariants}
          >
            <PricingCard isYearly={isYearly} plan={plan} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function PricingCard({
  plan,
  isYearly,
}: {
  plan: (typeof pricingPlans)[number];
  isYearly: boolean;
}) {
  const preferred = plan.preferred;

  return (
    <div
      className={`marketing-surface group relative flex h-full flex-col overflow-hidden border bg-surface transition-colors ${
        preferred
          ? "border-accent/40"
          : "border-border/50 hover:border-border"
      }`}
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
              {plan.name}
            </h3>
            <p className="text-sm leading-relaxed text-muted">
              {plan.description}
            </p>
          </div>
          {plan.badge && (
            <span
              className={`marketing-chip shrink-0 px-2.5 py-1 text-[11px] font-semibold ${
                preferred
                  ? "bg-accent text-accent-foreground"
                  : "bg-surface-secondary text-muted"
              }`}
            >
              {plan.badge}
            </span>
          )}
        </div>

        <div className="mt-6 flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-bold tracking-tight tabular-nums text-foreground">
            {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
          </span>
          <span className="text-sm text-muted">
            {plan.period}
            {isYearly && (
              <span className="text-accent"> · yearly</span>
            )}
          </span>
        </div>

        <div className="my-5 h-px w-full bg-border/50" />

        <ul className="flex flex-1 flex-col gap-2.5">
          {plan.features.map((feature) => (
            <li
              className="flex items-start gap-2.5 text-sm leading-snug text-foreground/90"
              key={feature}
            >
              <Icon
                className="mt-0.5 shrink-0 text-accent"
                icon="ph:check"
                width={16}
              />
              {feature}
            </li>
          ))}
        </ul>

        <Link
          className={`${buttonVariants({
            fullWidth: true,
            size: "lg",
            variant: preferred ? "primary" : "tertiary",
          })} button mt-7 font-medium`}
          href="/sign-in"
        >
          {plan.cta}
        </Link>
      </div>
    </div>
  );
}
