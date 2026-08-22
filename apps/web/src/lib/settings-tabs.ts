export const settingsTabs = [
  { id: "account", label: "Account", icon: "solar:user-linear" },
  { id: "subscription", label: "Subscription", icon: "solar:card-linear" },
  { id: "support", label: "Support", icon: "solar:chat-round-call-linear" },
] as const;

export type SettingsTab = (typeof settingsTabs)[number]["id"];

export function isSettingsTab(value: unknown): value is SettingsTab {
  return settingsTabs.some((tab) => tab.id === value);
}
