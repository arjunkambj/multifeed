"use client";

import { GeneralSettingsForm } from "@/components/settings/GeneralSettingsForm";
export function AccountSettingsPanel() {
  return (
    <div className="flex flex-col gap-6">
      <GeneralSettingsForm />
    </div>
  );
}
