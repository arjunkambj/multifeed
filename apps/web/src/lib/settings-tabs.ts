export const settingsTabs = [
  { id: "account", label: "Account", icon: "hugeicons:user-02" },
  { id: "support", label: "Support", icon: "hugeicons:headphones" },
] as const;

export type SettingsTab = (typeof settingsTabs)[number]["id"];

export function isSettingsTab(value: unknown): value is SettingsTab {
  return settingsTabs.some((tab) => tab.id === value);
}
