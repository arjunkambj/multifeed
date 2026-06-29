"use client";

import { Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";

const settingsTabs = [
  { id: "general", label: "General", icon: "solar:user-linear" },
  { id: "billing", label: "Billing", icon: "solar:card-linear" },
  { id: "support", label: "Support", icon: "solar:chat-round-call-linear" },
] as const;

export function SettingsLayout() {
  return (
    <div className="flex w-full flex-1 flex-col items-start gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Settings
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-muted">
          Manage your profile, organization, billing, and support preferences.
        </p>
      </header>

      <Tabs className="w-full" defaultSelectedKey="general" variant="secondary">
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

        <Tabs.Panel id="billing">{null}</Tabs.Panel>
        <Tabs.Panel id="support">{null}</Tabs.Panel>
      </Tabs>
    </div>
  );
}
