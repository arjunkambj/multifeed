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
          className="text-lg leading-relaxed text-muted"
          variants={revealItemVariants}
        >
          Choose the plan that fits your creator program. No hidden fees.
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
        className="grid grid-cols-1 items-start gap-6 md:grid-cols-3"
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
  <div className="relative flex h-full flex-col gap-4 rounded-[2rem] border border-border/50 bg-surface p-6 py-8 text-foreground">
    <div className="flex flex-col">
      <h3 className="text-4xl">{plan.name}</h3>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-5xl font-semibold">
        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
      </span>
      <span className="text-sm text-muted">{plan.period}</span>
    </div>
    <p className="my-2 text-sm text-muted">{plan.description}</p>
    <ul className="flex flex-col gap-3 border-t border-border pt-8">
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
  </div>
);
