"use client";

import { Button, Switch } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
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
      className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-20"
      id="pricing"
    >
      <motion.div
        className="flex flex-col items-center gap-2 text-center"
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
          className="text-4xl font-bold leading-tight"
          variants={revealItemVariants}
        >
          Simple, transparent pricing
        </motion.h2>
        <motion.span
          className="max-w-2xl text-lg leading-relaxed text-muted"
          variants={revealItemVariants}
        >
          Schedule everywhere, keep the calendar clean, and add analytics only
          when your team needs it.
        </motion.span>
        <motion.div
          className="marketing-control mt-1 flex items-center gap-1 border border-border/60 bg-surface px-1.5 py-0.5"
          role="group"
          variants={revealItemVariants}
        >
          <button
            className={`marketing-control-item cursor-pointer px-1.5 py-0.5 text-sm font-medium transition-colors ${
              !isYearly ? "text-foreground" : "text-muted hover:text-foreground"
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
            className={`marketing-control-item cursor-pointer px-1.5 py-0.5 text-sm font-medium transition-colors ${
              isYearly ? "text-foreground" : "text-muted hover:text-foreground"
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
        className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3"
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

const PricingCard = ({
  plan,
  isYearly,
}: {
  plan: (typeof pricingPlans)[number];
  isYearly: boolean;
}) => (
  <div
    className={`marketing-surface flex h-full flex-col gap-4 border bg-surface p-5 text-foreground ${
      plan.preferred ? "border-accent" : "border-border/50"
    }`}
  >
    {plan.badge && (
      <span
        className={`marketing-chip w-fit px-2.5 py-0.5 text-xs font-semibold ${
          plan.preferred
            ? "bg-accent text-accent-foreground"
            : "bg-accent/10 text-accent"
        }`}
      >
        {plan.badge}
      </span>
    )}
    <div className="flex flex-col gap-1">
      <h3 className="text-xl font-semibold">{plan.name}</h3>
      <p className="text-sm text-muted">{plan.description}</p>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-4xl font-semibold tabular-nums">
        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
      </span>
      <span className="text-sm text-muted">
        {plan.period}
        {isYearly && <span className="text-accent"> · billed yearly</span>}
      </span>
    </div>
    <ul className="flex flex-1 flex-col gap-2 border-t border-border pt-4">
      {plan.features.map((feature) => (
        <li className="flex items-start gap-2 text-sm" key={feature}>
          <Icon
            className="mt-0.5 shrink-0 text-accent"
            icon="ph:check"
            width={16}
          />
          {feature}
        </li>
      ))}
    </ul>
    <Button
      className="button mt-auto font-semibold"
      fullWidth
      size="lg"
      variant={plan.preferred ? "primary" : "secondary"}
    >
      {plan.cta}
    </Button>
  </div>
);
