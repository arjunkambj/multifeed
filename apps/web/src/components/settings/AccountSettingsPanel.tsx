"use client";

import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
import { hexclaveClientApp } from "@/hexclave/client";

export function AccountSettingsPanel() {
  const user = hexclaveClientApp.useUser({ or: "redirect" });

  return (
    <div className="mt-2 flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Manage your profile and workspace details.
      </p>
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Profile
        </p>
        <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-4">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {user.displayName}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {user.primaryEmail}
            </div>
          </div>
        </div>
      </div>
      <GeneralSettingsForm />
    </div>
  );
}
