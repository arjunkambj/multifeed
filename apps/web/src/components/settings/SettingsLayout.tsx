"use client";

import { Icon } from "@iconify/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { AccountSettingsPanel } from "@/components/settings/AccountSettingsPanel";
import { SupportSettingsPanel } from "@/components/settings/SupportSettingsPanel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isSettingsTab, settingsTabs } from "@/lib/settings-tabs";
import { hexclaveClientApp } from "@/hexclave/client";
import { cn } from "@/lib/utils";

const getInitials = (value: string | null) =>
  value
    ?.split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function SettingsLayout() {
  const user = hexclaveClientApp.useUser({ or: "redirect" });
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab");
  const selectedTab = isSettingsTab(rawTab) ? rawTab : "account";
  const initials =
    getInitials(user.displayName) || getInitials(user.primaryEmail);

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <DashboardPageTitle
        title="Settings"
        description="Manage your workspace and account preferences."
      />
      <div className="flex w-full max-w-4xl flex-col gap-6 lg:flex-row lg:gap-10">
        <aside className="flex w-full shrink-0 flex-col gap-6 lg:w-64">
          <section className="flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Account
            </p>
            <div className="flex items-center gap-3">
              <Avatar className="size-12 border border-border">
                {user.profileImageUrl && (
                  <AvatarImage
                    alt={user.displayName ?? ""}
                    src={user.profileImageUrl}
                  />
                )}
                <AvatarFallback className="text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {user.displayName ?? "Your account"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {user.primaryEmail}
                </div>
              </div>
            </div>
          </section>

          <nav aria-label="Settings sections" className="flex flex-col gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sections
            </p>
            <ul className="flex flex-col gap-1">
              {settingsTabs.map((tab, index) => (
                <li key={tab.id}>
                  <Link
                    href={
                      tab.id === "account"
                        ? "/settings"
                        : `/settings?tab=${tab.id}`
                    }
                    replace
                    scroll={false}
                    aria-current={selectedTab === tab.id ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors duration-200 motion-reduce:transition-none focus-visible:ring-3 focus-visible:ring-ring/30",
                      selectedTab === tab.id
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    <span className="w-6 text-[11px] tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <Icon icon={tab.icon} width={16} />
                    {tab.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div
          key={selectedTab}
          className="tab-panel-transition flex min-w-0 flex-1 flex-col gap-4"
        >
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {settingsTabs.find((tab) => tab.id === selectedTab)?.label}
          </h2>
          {selectedTab === "account" ? <AccountSettingsPanel /> : null}
          {selectedTab === "support" ? <SupportSettingsPanel /> : null}
        </div>
      </div>
    </div>
  );
}
