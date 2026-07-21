"use client";

import { Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";
import { BillingPage } from "@/components/billing/BillingPage";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";

const settingsTabs = [
  { id: "general", label: "General", icon: "solar:user-linear" },
  { id: "billing", label: "Billing", icon: "solar:card-linear" },
  { id: "support", label: "Support", icon: "solar:chat-round-call-linear" },
] as const;

type SettingsTab = (typeof settingsTabs)[number]["id"];

function isSettingsTab(value: string | null): value is SettingsTab {
  return settingsTabs.some((tab) => tab.id === value);
}

export function SettingsLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const selectedTab = isSettingsTab(tabParam) ? tabParam : "general";

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
          if (!isSettingsTab(next) || next === "general") {
            router.replace("/settings", { scroll: false });
            return;
          }
          router.replace(`/settings?tab=${next}`, { scroll: false });
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
                <Icon icon={tab.icon} className="size-4" />
                {tab.label}
                <Tabs.Indicator />
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="w-full pt-4" id="general">
          <GeneralSettingsForm />
        </Tabs.Panel>

        <Tabs.Panel className="w-full pt-4" id="billing">
          <BillingPage />
        </Tabs.Panel>

        <Tabs.Panel className="w-full pt-4" id="support">
          <div className="flex max-w-xl flex-col gap-3 rounded-2xl bg-surface-secondary p-5">
            <p className="text-sm leading-relaxed text-muted">
              Need help with posting, billing, or your workspace? Reach out and
              we&apos;ll get you unstuck.
            </p>
            <a
              className="text-sm font-medium text-accent hover:underline"
              href="mailto:support@themultifeed.com"
            >
              support@themultifeed.com
            </a>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
