"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
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
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
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
          className="mt-2 flex items-center gap-1 rounded-xl border border-border/50 bg-card px-1.5 py-1"
          role="group"
        >
          <Button
            className={cn(
              "cursor-pointer rounded-lg px-2.5",
              isYearly && "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setIsYearly(false)}
            size="sm"
            type="button"
            variant={!isYearly ? "secondary" : "ghost"}
          >
            Monthly
          </Button>
          <Switch
            aria-label="Toggle yearly billing"
            checked={isYearly}
            onCheckedChange={(checked) => setIsYearly(checked)}
          />
          <Button
            className={cn(
              "cursor-pointer rounded-lg px-2.5",
              !isYearly && "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setIsYearly(true)}
            size="sm"
            type="button"
            variant={isYearly ? "secondary" : "ghost"}
          >
            Yearly
            <span className="text-xs text-primary"> · Save 20%</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-3 md:gap-5">
        {pricingPlans.map((plan) => (
          <PricingCard isYearly={isYearly} key={plan.name} plan={plan} />
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
    <Card
      className={cn(
        "h-full transition-colors hover:ring-foreground/10",
        preferred && "ring-primary/40",
      )}
    >
      <CardHeader>
        <CardTitle className="font-display text-xl font-semibold tracking-tight">
          {plan.name}
        </CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        {plan.badge && (
          <CardAction>
            <Badge variant={preferred ? "default" : "secondary"}>
              {plan.badge}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-4xl font-bold tabular-nums tracking-tight">
            {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
          </span>
          <span className="text-sm text-muted-foreground">
            {plan.period}
            {isYearly && (
              <span className="text-primary"> · billed annually</span>
            )}
          </span>
        </div>
        <Separator className="my-5" />
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
      </CardContent>
      <CardFooter>
        <Link
          className={buttonVariants({
            size: "lg",
            variant: preferred ? "default" : "ghost",
          })}
          href="/sign-in"
        >
          {plan.cta}
        </Link>
      </CardFooter>
    </Card>
  );
}
