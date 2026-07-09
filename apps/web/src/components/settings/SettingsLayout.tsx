"use client";

import { Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";
import { BillingPage } from "@/components/billing/BillingPage";
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
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Settings
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted">
          Manage your profile, organization, billing, and support preferences.
        </p>
      </header>

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
        variant="secondary"
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

        <Tabs.Panel className="flex w-full flex-col gap-8 pt-6" id="general">
          <GeneralSettingsForm />
        </Tabs.Panel>

        <Tabs.Panel className="w-full pt-6" id="billing">
          <BillingPage />
        </Tabs.Panel>

        <Tabs.Panel className="w-full pt-6" id="support">
          <div className="flex max-w-xl flex-col gap-3 rounded-2xl border border-border/50 bg-surface-secondary/60 p-5 sm:p-6">
            <h2 className="font-heading text-lg font-semibold text-foreground">
              Support
            </h2>
            <p className="text-sm leading-relaxed text-muted">
              Need help with posting, billing, or your workspace? Reach out and
              we&apos;ll get you unstuck.
            </p>
            <a
              className="text-sm font-medium text-accent hover:underline"
              href="mailto:support@unifeed.app"
            >
              support@unifeed.app
            </a>
          </div>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
