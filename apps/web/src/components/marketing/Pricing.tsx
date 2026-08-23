"use client";

import Reveal from "@/components/motion/Reveal";
import { buttonVariants } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useState } from "react";

import { pricingPlans } from "@/constants/landing-page";

import {
  GRID_GAP,
  HEADER_GAP,
  OVERLINE,
  PLATFORM_ICON,
  platforms,
} from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

type Cycle = "monthly" | "yearly";

export function Pricing() {
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const isYearly = cycle === "yearly";

  return (
    <Section id="pricing">
      <SectionHeader
        eyebrow="Pricing"
        title="Unlimited posts on every plan."
        titleMuted="You pay for accounts, not posts."
      />

      <div
        className={cn(HEADER_GAP, "flex flex-col items-center gap-8 md:gap-10")}
      >
        <Reveal>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={cn(
                "text-sm leading-5 font-medium transition-colors",
                cycle === "monthly"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Monthly
            </button>
            <Switch
              aria-label="Bill yearly"
              checked={cycle === "yearly"}
              onCheckedChange={(checked) =>
                setCycle(checked ? "yearly" : "monthly")
              }
            />
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={cn(
                "flex items-center gap-2 text-sm leading-5 font-medium transition-colors",
                cycle === "yearly"
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              Yearly
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.6875rem] leading-4 font-semibold text-primary">
                Save 20%
              </span>
            </button>
          </div>
        </Reveal>

        <div
          className={cn("grid w-full items-stretch md:grid-cols-3", GRID_GAP)}
        >
          {pricingPlans.map((plan) => (
            <Reveal
              key={plan.name}
              delay={plan.preferred ? 0.07 : 0}
              className="h-full"
            >
              <PriceCard isYearly={isYearly} plan={plan} />
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal
        className={cn(
          HEADER_GAP,
          "flex flex-wrap items-center justify-center gap-4",
        )}
      >
        <span className={`text-muted-foreground ${OVERLINE}`}>Post to</span>
        <ul className="flex flex-wrap items-center justify-center gap-3.5 md:gap-4">
          {platforms.map((platform) => (
            <li key={platform.label}>
              <span
                role="img"
                title={platform.label}
                aria-label={platform.label}
                className="flex cursor-pointer items-center justify-center transition-transform duration-200 hover:scale-[1.12] active:scale-95"
                style={{ color: platform.color }}
              >
                <Icon
                  icon={platform.icon}
                  className={`block shrink-0 ${PLATFORM_ICON}`}
                />
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}

function PriceCard({
  plan,
  isYearly,
}: {
  plan: (typeof pricingPlans)[number];
  isYearly: boolean;
}) {
  const preferred = plan.preferred;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-card border bg-card hover:border-primary/20",
        preferred ? "border-primary/40" : "border-transparent",
        "px-6 py-7 md:px-7 md:py-8",
      )}
    >
      <header>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-[1.0625rem] leading-6 font-medium tracking-[-0.02em] text-foreground">
            {plan.name}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] leading-4 font-medium",
              preferred
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground",
            )}
          >
            {plan.badge}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="font-heading text-[2.5rem] leading-none font-medium tracking-[-0.045em] text-foreground md:text-[2.75rem]">
            {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
          </span>
          <span className="text-sm leading-5 text-muted-foreground">
            {plan.period}
            {isYearly && <span className="ml-1">billed annually</span>}
          </span>
        </div>

        <p className="mt-2 text-sm leading-5 text-muted-foreground">
          {plan.description}
        </p>
      </header>

      <div className="mt-7 flex-1 border-t border-foreground/[0.08] pt-6">
        <p className={`text-muted-foreground ${OVERLINE}`}>Includes</p>
        <ul className="mt-3 space-y-1">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-[0.9375rem] leading-6"
            >
              <Icon
                icon="lucide:check"
                width={16}
                height={16}
                className="mt-[5px] shrink-0 text-primary"
              />
              <span className="text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-5">
        <Link
          href="/sign-in"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5 active:[&_svg]:translate-x-0",
            "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {plan.cta}
        </Link>
      </div>
    </div>
  );
}
