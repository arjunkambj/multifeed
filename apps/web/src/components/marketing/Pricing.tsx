"use client";

import { Button, Label, Switch } from "@heroui/react";
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
      className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-24"
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
          className="mt-4 flex items-center gap-3 rounded-2xl border border-border/60 bg-surface/80 px-3 py-1.5"
          variants={revealItemVariants}
        >
          <Label
            className={`cursor-pointer text-sm font-medium ${
              !isYearly ? "text-foreground" : "text-muted"
            }`}
          >
            Monthly
          </Label>
          <Switch isSelected={isYearly} onChange={setIsYearly}>
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
          <Label
            className={`cursor-pointer text-sm font-medium ${
              isYearly ? "text-foreground" : "text-muted"
            }`}
          >
            Yearly
            <span className="ml-1 text-xs text-accent">(Save 20%)</span>
          </Label>
        </motion.div>
      </motion.div>
      <motion.div
        className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3"
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
    className={`relative flex h-full flex-col gap-5 rounded-[2rem] border bg-surface p-6 py-8 text-foreground shadow-sm ${
      plan.preferred
        ? "border-accent/80 shadow-accent/10"
        : "border-border/50"
    }`}
  >
    {plan.badge && (
      <span
        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
          plan.preferred
            ? "bg-accent text-accent-foreground"
            : "bg-accent/10 text-accent"
        }`}
      >
        {plan.badge}
      </span>
    )}
    <div className="flex flex-col gap-2">
      <h3 className="text-3xl font-semibold">{plan.name}</h3>
      <p className="text-sm leading-relaxed text-muted">{plan.description}</p>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-5xl font-semibold">
        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
      </span>
      <span className="text-sm text-muted">{plan.period}</span>
    </div>
    {isYearly && (
      <p className="text-sm font-medium text-accent">
        Billed yearly. Save 20%.
      </p>
    )}
    <ul className="flex flex-col gap-3 border-t border-border pt-6">
      {plan.features.map((feature) => (
        <li className="flex items-start gap-2.5 text-sm" key={feature}>
          <Icon
            className="mt-0.5 shrink-0 text-base text-accent"
            icon="ph:check"
          />
          {feature}
        </li>
      ))}
    </ul>
    <Button className="mt-auto font-semibold" fullWidth size="lg">
      {plan.cta}
    </Button>
    <p className="text-center text-xs text-muted">
      $0 due today. Cancel anytime.
    </p>
  </div>
);
