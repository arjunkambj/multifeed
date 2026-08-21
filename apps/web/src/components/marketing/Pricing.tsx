"use client";

import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useState } from "react";

import { pricingPlans } from "@/constants/landing-page";

export function Pricing() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24"
      id="pricing"
    >
      <div
        className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          Pricing
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          A plan that fits the way you publish.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Start with the accounts and seats you need, then move up when your
          team or client list grows.
        </p>
        <div
          className="rounded-xl mt-2 flex items-center gap-1 border border-border/50 bg-card px-1.5 py-1"
          role="group"
        >
          <button
            className={`rounded-lg cursor-pointer px-2.5 py-1 text-sm font-medium transition-colors ${
              !isYearly
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setIsYearly(false)}
            type="button"
          >
            Monthly
          </button>
          <Switch
            checked={isYearly}
            onCheckedChange={(checked) => setIsYearly(checked)}
          />
          <button
            className={`rounded-lg cursor-pointer px-2.5 py-1 text-sm font-medium transition-colors ${
              isYearly
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setIsYearly(true)}
            type="button"
          >
            Yearly
            <span className="text-xs text-primary"> · Save 20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:gap-5">
        {pricingPlans.map((plan) => (
          <div className="h-full" key={plan.name}>
            <PricingCard isYearly={isYearly} plan={plan} />
          </div>
        ))}
      </div>
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
      className={`rounded-2xl group relative flex h-full flex-col overflow-hidden border bg-card transition-colors ${
        preferred ? "border-primary/40" : "border-border/50 hover:border-border"
      }`}
    >
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
              {plan.name}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {plan.description}
            </p>
          </div>
          {plan.badge && (
            <span
              className={`rounded-full shrink-0 px-2.5 py-1 text-[11px] font-semibold ${
                preferred
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
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
          <span className="text-sm text-muted-foreground">
            {plan.period}
            {isYearly && (
              <span className="text-primary"> · billed annually</span>
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
                className="mt-0.5 shrink-0 text-primary"
                icon="ph:check"
                width={16}
              />
              {feature}
            </li>
          ))}
        </ul>

        <Link
          className={`${buttonVariants({
            size: "lg",
            variant: preferred ? "default" : "ghost",
          })} mt-7 w-full font-medium`}
          href="/sign-in"
        >
          {plan.cta}
        </Link>
      </div>
    </div>
  );
}
