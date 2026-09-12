import { Headphones, User } from "@honeyicons/react";

export const settingsTabs = [
  { id: "account", label: "Account", icon: User },
  { id: "support", label: "Support", icon: Headphones },
] as const;

export type SettingsTab = (typeof settingsTabs)[number]["id"];

export function isSettingsTab(value: unknown): value is SettingsTab {
  return settingsTabs.some((tab) => tab.id === value);
}
