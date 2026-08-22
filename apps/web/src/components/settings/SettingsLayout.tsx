"use client";

import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { BillingPage } from "@/components/billing/BillingPage";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isSettingsTab, settingsTabs } from "@/lib/settings-tabs";

export function SettingsLayout() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const selectedTab = isSettingsTab(rawTab) ? rawTab : "general";
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="flex w-full flex-1 flex-col items-start gap-6">
      <DashboardPageTitle
        title="Settings"
        description="Manage your organization, billing, and support preferences."
      />

      <Tabs
        className="w-full"
        value={selectedTab}
        onValueChange={(key) => {
          const next = String(key);
          startTransition(() => {
            if (!isSettingsTab(next) || next === "general") {
              router.replace("/settings", { scroll: false });
              return;
            }
            router.replace(`/settings?tab=${next}`, { scroll: false });
          });
        }}
      >
        <TabsList className="w-fit *:min-w-28 *:gap-2 *:px-4">
          {settingsTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <Icon icon={tab.icon} width={16} />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent className="w-full pt-4" value="general">
          {selectedTab === "general" ? <GeneralSettingsForm /> : null}
        </TabsContent>

        <TabsContent className="w-full pt-4" value="billing">
          {selectedTab === "billing" ? <BillingPage /> : null}
        </TabsContent>

        <TabsContent className="w-full pt-4" value="support">
          {selectedTab === "support" ? (
            <div className="flex max-w-xl flex-col gap-3 rounded-2xl bg-muted p-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Need help with posting, billing, or your workspace? Reach out
                and we&apos;ll get you unstuck.
              </p>
              <a
                className="text-sm font-medium text-primary hover:underline"
                href="mailto:support@themultifeed.com"
              >
                support@themultifeed.com
              </a>
            </div>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
