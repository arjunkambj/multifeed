"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@iconify/react";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import { api } from "@convex/_generated/api";
import { PLANS } from "@multifeed/plans";
import type { BillingInterval, PlanKey } from "@multifeed/plans";

const intervalLabels = {
  month: "/month",
  year: "/month · yearly",
} as const;

const freePlan = {
  name: "Free",
  description: "For getting started with a single social account.",
  features: [
    "1 connected social account",
    "Unlimited scheduled posts",
    "No team seats",
  ],
} as const;

const statusLabels: Record<string, string> = {
  active: "Active",
  cancelled: "Cancelled",
  expired: "Expired",
  failed: "Failed",
  on_hold: "On hold",
  pending: "Pending",
  plan_changed: "Active",
  renewed: "Active",
  updated: "Active",
};

function statusLabel(status: unknown) {
  return typeof status === "string" && status in statusLabels
    ? statusLabels[status]
    : "Unknown";
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value?: number) {
  if (!value) return null;
  return dateFormatter.format(new Date(value));
}

export function BillingPage({
  preloaded,
}: {
  preloaded: Preloaded<typeof api.billing.getSubscription>;
}) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");
  const [checkingOut, setCheckingOut] = useState<PlanKey | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const subscription = usePreloadedQuery(preloaded);
  const isYearly = billingInterval === "year";
  const activePlan = subscription?.hasPlanAccess
    ? PLANS.find((plan) => plan.key === subscription.planKey)
    : undefined;
  const checkoutBlocked = subscription?.canStartCheckout === false;

  const startCheckout = (planKey: PlanKey) => {
    setCheckingOut(planKey);

    void fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planKey, interval: billingInterval }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not start checkout");
        const payload = (await response.json()) as {
          checkoutUrl?: string;
          error?: string;
        };
        if (!payload.checkoutUrl) {
          throw new Error(payload.error ?? "Could not start checkout");
        }
        window.location.assign(payload.checkoutUrl);
      })
      .catch((err) => {
        setCheckingOut(null);
        toast.error(err instanceof Error ? err.message : String(err));
      });
  };

  const openCustomerPortal = () => {
    setOpeningPortal(true);
    void fetch("/api/billing/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not open billing portal");
        const payload = (await response.json()) as {
          url?: string;
          error?: string;
        };
        if (!payload.url) {
          throw new Error(payload.error ?? "Could not open billing portal");
        }
        window.location.assign(payload.url);
      })
      .catch((err) => {
        setOpeningPortal(false);
        toast.error(err instanceof Error ? err.message : String(err));
      });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-2xl bg-muted p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:card-linear"
              width={20}
              className="shrink-0 text-muted-foreground"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {activePlan ? activePlan.name : "No active plan"}
              </span>
              <span className="text-sm text-muted-foreground">
                {subscription
                  ? `${statusLabel(subscription.status)} · ${subscription.interval === "year" ? "Yearly" : "Monthly"}`
                  : "Choose a plan to activate billing."}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {subscription && (
              <span className="rounded-full bg-card px-3 py-1.5 text-sm font-medium text-foreground">
                {subscription.hasPlanAccess &&
                subscription.status !== "cancelled" &&
                formatDate(subscription.currentPeriodEnd)
                  ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                  : statusLabel(subscription.status)}
              </span>
            )}
            {subscription?.dodoCustomerId && (
              <Button
                className="font-medium"
                disabled={openingPortal}
                onClick={openCustomerPortal}
                size="sm"
                variant="secondary"
              >
                {openingPortal ? <Spinner className="size-3" /> : null}
                Manage subscription
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Billing interval</p>
        <div
          className="flex items-center gap-1 rounded-xl border border-border/50 bg-card px-1.5 py-1"
          role="group"
        >
          <button
            className={`cursor-pointer rounded-lg px-2.5 py-1 text-sm font-medium transition-colors ${
              !isYearly
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setBillingInterval("month")}
            type="button"
          >
            Monthly
          </button>
          <Switch
            checked={isYearly}
            onCheckedChange={(checked) =>
              setBillingInterval(checked ? "year" : "month")
            }
          />
          <button
            className={`cursor-pointer rounded-lg px-2.5 py-1 text-sm font-medium transition-colors ${
              isYearly
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setBillingInterval("year")}
            type="button"
          >
            Yearly
            <span className="text-xs text-primary"> · Save 20%</span>
          </button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:gap-5">
        <article className="flex flex-col overflow-hidden rounded-2xl bg-muted">
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-xl font-semibold tracking-tight text-foreground">
                {freePlan.name}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {freePlan.description}
              </p>
            </div>

            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="font-display text-4xl font-bold tracking-tight tabular-nums text-foreground">
                $0
              </span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>

            <div className="my-5 h-px w-full bg-border/50" />

            <ul className="flex flex-1 flex-col gap-2.5">
              {freePlan.features.map((feature) => (
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

            <Button
              className="mt-7 w-full max-w-sm self-center font-medium"
              disabled
              size="lg"
              variant="secondary"
            >
              Free plan
            </Button>
          </div>
        </article>
        {PLANS.map((plan) => {
          const isCurrent =
            subscription?.hasPlanAccess === true &&
            subscription.planKey === plan.key &&
            subscription.interval === billingInterval;
          const isPending = checkingOut === plan.key;
          const preferred = plan.key === "growth";

          return (
            <article
              className="flex flex-col overflow-hidden rounded-2xl bg-muted"
              key={plan.key}
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
                  {preferred && (
                    <span className="shrink-0 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                      Best value
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-bold tracking-tight tabular-nums text-foreground">
                    ${plan.prices[billingInterval]}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {intervalLabels[billingInterval]}
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

                <Button
                  className="mt-7 w-full max-w-sm self-center font-medium"
                  disabled={
                    isCurrent || checkoutBlocked || checkingOut !== null
                  }
                  onClick={() => startCheckout(plan.key)}
                  size="lg"
                  variant="default"
                >
                  {isPending ? <Spinner className="size-4" /> : null}
                  {isCurrent
                    ? "Current plan"
                    : checkoutBlocked
                      ? "Existing subscription"
                      : "Choose this plan"}
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
