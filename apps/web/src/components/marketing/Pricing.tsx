"use client";

import Reveal from "@/components/motion/Reveal";
import { buttonVariants } from "@multifeed/ui/components/button";
import { Switch } from "@multifeed/ui/components/switch";
import { cn } from "@multifeed/ui/lib/utils";
import { Check } from "@honeyicons/react";
import Link from "next/link";
import { type CSSProperties, useState } from "react";

import { pricingPlans } from "@/constants/landing-page";

import { GRID_GAP, HEADER_GAP, OVERLINE, platforms } from "./rhythm";
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
              <span
                className="rounded-full bg-primary/10 px-1.5 py-0.5 text-(length:--chip-fs) leading-4 font-semibold text-primary"
                style={{ "--chip-fs": "0.6875rem" } as CSSProperties}
              >
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
                className="flex items-center justify-center text-(--platform-ink) transition-transform duration-200 hover:scale-[1.12]"
                style={{ "--platform-ink": platform.color } as CSSProperties}
              >
                <platform.icon className="block size-5.5 shrink-0 md:size-6" />
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
  return (
    <div className="flex h-full flex-col rounded-card border border-transparent bg-card px-6 py-7 md:px-7 md:py-8">
      <header>
        <div className="flex items-center justify-between gap-3">
          <h3
            className="font-heading text-(length:--plan-fs) leading-6 font-medium tracking-(--plan-ls) text-foreground"
            style={
              {
                "--plan-fs": "1.0625rem",
                "--plan-ls": "-0.02em",
              } as CSSProperties
            }
          >
            {plan.name}
          </h3>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-(length:--badge-fs) leading-4 font-medium",
              plan.preferred
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground",
            )}
            style={{ "--badge-fs": "0.6875rem" } as CSSProperties}
          >
            {plan.badge}
          </span>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <span
            className="font-heading text-(length:--price-fs) leading-none font-medium tracking-(--price-ls) text-foreground md:text-(length:--price-fs-md)"
            style={
              {
                "--price-fs": "2.5rem",
                "--price-fs-md": "2.75rem",
                "--price-ls": "-0.045em",
              } as CSSProperties
            }
          >
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
              className="flex items-start gap-2.5 text-(length:--feature-fs) leading-6"
              style={{ "--feature-fs": "0.9375rem" } as CSSProperties}
            >
              <Check size={16} className="mt-[5px] shrink-0 text-primary" />
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
