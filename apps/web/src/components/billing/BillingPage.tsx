"use client";

import { useMemo, useState } from "react";
import { Button, Spinner, Switch } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { PLANS } from "@/constants/plans";
import type { BillingInterval, PlanKey } from "@/constants/plans";

const intervalLabels: Record<BillingInterval, string> = {
  month: "/month",
  year: "/month, billed yearly",
};

const statusLabels = {
  active: "Active",
  cancelled: "Cancelled",
  expired: "Expired",
  failed: "Failed",
  on_hold: "On hold",
  pending: "Pending",
  plan_changed: "Active",
  renewed: "Active",
  updated: "Active",
} as const;

const statusLabel = (status: unknown) =>
  typeof status === "string" && status in statusLabels
    ? statusLabels[status as keyof typeof statusLabels]
    : "Unknown";

const formatDate = (value?: number) =>
  value
    ? new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : null;

export function BillingPage() {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [checkingOut, setCheckingOut] = useState<PlanKey | null>(null);
  const [error, setError] = useState("");
  const subscription = useQuery(api.dodopayment.getCurrentSubscription, {});
  const isYearly = interval === "year";
  const activePlan = useMemo(
    () => PLANS.find((plan) => plan.key === subscription?.planKey),
    [subscription?.planKey],
  );

  const startCheckout = async (planKey: PlanKey) => {
    setCheckingOut(planKey);
    setError("");

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
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Billing
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Choose the workspace plan that matches your publishing volume.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-surface-secondary p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Icon icon="solar:card-linear" className="size-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {activePlan ? activePlan.name : "No active plan"}
              </span>
              <span className="text-sm text-muted">
                {subscription
                  ? `${statusLabel(subscription.status)} plan`
                  : "Start checkout to activate billing."}
              </span>
            </div>
          </div>
          {subscription === undefined && (
            <Spinner color="current" size="sm" />
          )}
          {subscription && (
            <span className="rounded-lg border border-border bg-surface px-3 py-1 text-sm font-medium">
              {formatDate(subscription.currentPeriodEnd)
                ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                : `${subscription.interval === "year" ? "Yearly" : "Monthly"}`}
            </span>
          )}
        </div>
      </section>

      <div
        className="flex w-fit items-center gap-2 rounded-lg border border-border bg-surface-secondary p-1"
        role="group"
      >
        <button
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            !isYearly ? "bg-surface text-foreground" : "text-muted"
          }`}
          onClick={() => setInterval("month")}
          type="button"
        >
          Monthly
        </button>
        <Switch isSelected={isYearly} onChange={() => setInterval(isYearly ? "month" : "year")}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
        <button
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            isYearly ? "bg-surface text-foreground" : "text-muted"
          }`}
          onClick={() => setInterval("year")}
          type="button"
        >
          Yearly
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent =
            subscription?.planKey === plan.key &&
            subscription.interval === interval;
          const isPending = checkingOut === plan.key;

          return (
            <article
              className={`flex min-h-[32rem] flex-col rounded-lg border bg-surface p-5 ${
                plan.key === "growth" ? "border-accent" : "border-border"
              }`}
              key={plan.key}
            >
              <div className="flex flex-1 flex-col gap-5">
                <div className="flex min-h-28 flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold text-foreground">
                      {plan.name}
                    </h2>
                    {plan.key === "growth" && (
                      <span className="rounded-md bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                        Best value
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-6 text-muted">
                    {plan.description}
                  </p>
                </div>

                <div className="flex items-end gap-1 border-b border-border pb-5">
                  <span className="text-4xl font-semibold tabular-nums">
                    ${plan.prices[interval]}
                  </span>
                  <span className="pb-1 text-sm text-muted">
                    {intervalLabels[interval]}
                  </span>
                </div>

                <ul className="flex flex-1 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li className="flex items-start gap-2 text-sm" key={feature}>
                      <Icon
                        icon="solar:check-circle-linear"
                        className="mt-0.5 size-4 shrink-0 text-accent"
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button
                className="mt-6 font-semibold"
                fullWidth
                isDisabled={isCurrent || checkingOut !== null}
                isPending={isPending}
                onPress={() => startCheckout(plan.key)}
                size="lg"
                variant={plan.key === "growth" ? "primary" : "secondary"}
              >
                {({ isPending }) => (
                  <>
                    {isPending ? (
                      <Spinner color="current" size="sm" />
                    ) : (
                      <Icon icon="solar:card-linear" className="size-4" />
                    )}
                    {isCurrent ? "Current plan" : "Start checkout"}
                  </>
                )}
              </Button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
