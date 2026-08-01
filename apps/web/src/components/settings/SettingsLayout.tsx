"use client";

import { useTransition } from "react";
import { Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import type { Preloaded } from "convex/react";
import { api } from "@convex/_generated/api";
import { BillingPage } from "@/components/billing/BillingPage";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
import {
  isSettingsTab,
  settingsTabs,
  type SettingsTab,
} from "@/lib/settings-tabs";

export function SettingsLayout({
  preloadedSubscription,
  selectedTab,
}: {
  preloadedSubscription?: Preloaded<typeof api.billing.getSubscription>;
  selectedTab: SettingsTab;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-6">
      <DashboardPageTitle
        title="Settings"
        description="Manage your profile, organization, billing, and support preferences."
      />

      <Tabs
        className="w-full"
        selectedKey={selectedTab}
        onSelectionChange={(key) => {
          const next = String(key);
          startTransition(() => {
            if (!isSettingsTab(next) || next === "general") {
              router.replace("/settings", { scroll: false });
              return;
            }
            router.replace(`/settings?tab=${next}`, { scroll: false });
          });
        }}
        variant="primary"
      >
        <Tabs.ListContainer>
          <Tabs.List
            aria-label="Settings sections"
            className="w-fit *:min-w-28 *:gap-2 *:px-4"
          >
            {settingsTabs.map((tab) => (
              <Tabs.Tab id={tab.id} key={tab.id}>
                <Icon icon={tab.icon} width={16} />
                {tab.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="w-full pt-4" id="general">
          {selectedTab === "general" ? <GeneralSettingsForm /> : null}
        </Tabs.Panel>

        <Tabs.Panel className="w-full pt-4" id="billing">
          {selectedTab === "billing" && preloadedSubscription ? (
            <BillingPage preloaded={preloadedSubscription} />
          ) : null}
        </Tabs.Panel>

        <Tabs.Panel className="w-full pt-4" id="support">
          {selectedTab === "support" ? (
            <div className="flex max-w-xl flex-col gap-3 rounded-2xl bg-surface-secondary p-5">
              <p className="text-sm leading-relaxed text-muted">
                Need help with posting, billing, or your workspace? Reach out
                and we&apos;ll get you unstuck.
              </p>
              <a
                className="text-sm font-medium text-accent hover:underline"
                href="mailto:support@themultifeed.com"
              >
                support@themultifeed.com
              </a>
            </div>
          ) : null}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
