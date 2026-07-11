"use client";

import { useMemo, useState } from "react";
import { Button, Spinner, Switch, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PLANS } from "@/constants/plans";
import type { BillingInterval, PlanKey } from "@/constants/plans";

const intervalLabels = {
  month: "/month",
  year: "/month · yearly",
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

function formatDate(value?: number) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function BillingPage() {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [checkingOut, setCheckingOut] = useState<PlanKey | null>(null);
  const subscription = useQuery(api.billing.getSubscription, {});
  const isYearly = interval === "year";
  const activePlan = useMemo(
    () => PLANS.find((plan) => plan.key === subscription?.planKey),
    [subscription?.planKey],
  );

  const startCheckout = async (planKey: PlanKey) => {
    setCheckingOut(planKey);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planKey, interval }),
      });
      const payload = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };

      if (!response.ok || !payload.checkoutUrl) {
        throw new Error(payload.error ?? "Could not start checkout");
      }

      window.location.assign(payload.checkoutUrl);
    } catch (err) {
      setCheckingOut(null);
      toast.danger(err instanceof Error ? err.message : String(err), {
        timeout: 3000,
      });
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="flex flex-col gap-3 rounded-2xl bg-surface-secondary p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:card-linear"
              className="size-5 shrink-0 text-muted"
            />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {activePlan ? activePlan.name : "No active plan"}
              </span>
              <span className="text-sm text-muted">
                {subscription
                  ? `${statusLabel(subscription.status)} · ${subscription.interval === "year" ? "Yearly" : "Monthly"}`
                  : "Start a trial to activate billing."}
              </span>
            </div>
          </div>
          {subscription === undefined && <Spinner color="current" size="sm" />}
          {subscription && (
            <span className="marketing-chip bg-surface px-3 py-1.5 text-sm font-medium text-foreground">
              {formatDate(subscription.currentPeriodEnd)
                ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                : "Active"}
            </span>
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Billing interval</p>
        <div
          className="marketing-control flex items-center gap-1 border border-border/50 bg-surface px-1.5 py-1"
          role="group"
        >
          <button
            className={`marketing-control-item cursor-pointer px-2.5 py-1 text-sm font-medium transition-colors ${
              !isYearly
                ? "bg-surface-secondary text-foreground"
                : "text-muted hover:text-foreground"
            }`}
            onClick={() => setInterval("month")}
            type="button"
          >
            Monthly
          </button>
          <Switch
            isSelected={isYearly}
            onChange={() => setInterval(isYearly ? "month" : "year")}
          >
            <Switch.Control>
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
          <button
            className={`marketing-control-item cursor-pointer px-2.5 py-1 text-sm font-medium transition-colors ${
              isYearly
                ? "bg-surface-secondary text-foreground"
                : "text-muted hover:text-foreground"
            }`}
            onClick={() => setInterval("year")}
            type="button"
          >
            Yearly
            <span className="text-xs text-accent"> · Save 20%</span>
          </button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {PLANS.map((plan) => {
          const isCurrent =
            subscription?.planKey === plan.key &&
            subscription.interval === interval;
          const isPending = checkingOut === plan.key;
          const preferred = plan.key === "growth";

          return (
            <article
              className="flex flex-col overflow-hidden rounded-2xl bg-surface-secondary"
              key={plan.key}
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
                  {preferred && (
                    <span className="marketing-chip shrink-0 bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
                      Best value
                    </span>
                  )}
                </div>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-bold tracking-tight tabular-nums text-foreground">
                    ${plan.prices[interval]}
                  </span>
                  <span className="text-sm text-muted">
                    {intervalLabels[interval]}
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

                <Button
                  className="button mt-7 w-full max-w-sm self-center font-medium"
                  isDisabled={isCurrent || checkingOut !== null}
                  isPending={isPending}
                  onPress={() => startCheckout(plan.key)}
                  size="lg"
                  variant="primary"
                >
                  {({ isPending: pending }) => (
                    <>
                      {pending ? <Spinner color="current" size="sm" /> : null}
                      {isCurrent ? "Current plan" : "Start 7-day free trial"}
                    </>
                  )}
                </Button>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
