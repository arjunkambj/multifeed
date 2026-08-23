"use client";

import { Icon } from "@iconify/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
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
  const router = useRouter();
  const [, startTransition] = useTransition();
  const initials =
    getInitials(user.displayName) || getInitials(user.primaryEmail);

  const selectTab = (key: string) => {
    startTransition(() => {
      if (!isSettingsTab(key) || key === "account") {
        router.replace("/settings", { scroll: false });
        return;
      }
      router.replace(`/settings?tab=${key}`, { scroll: false });
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 pt-8 lg:flex-row lg:gap-10">
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
                <button
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    selectedTab === tab.id
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                  onClick={() => selectTab(tab.id)}
                >
                  <span className="w-6 text-[11px] tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Icon icon={tab.icon} width={16} />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {settingsTabs.find((tab) => tab.id === selectedTab)?.label}
        </h1>
        {selectedTab === "account" ? <AccountSettingsPanel /> : null}
        {selectedTab === "support" ? <SupportSettingsPanel /> : null}
      </div>
    </div>
  );
}
