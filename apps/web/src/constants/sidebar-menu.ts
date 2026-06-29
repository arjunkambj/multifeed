import type { Route } from "next";

export interface MenuItem {
  name: string;
  href: Route;
  icon: string;
}

export interface MenuCategory {
  name: string;
  icon: string;
  items: MenuItem[];
}

export const sidebarMainItems: MenuItem[] = [
  {
    name: "Overview",
    href: "/overview",
    icon: "hugeicons:home-03",
  },
];

export const sidebarCategories: MenuCategory[] = [
  {
    name: "Socials",
    icon: "hugeicons:global",
    items: [
      {
        name: "Social Account",
        href: "/socials/accounts",
        icon: "hugeicons:user-group",
      },
    ],
  },
];

export const sidebarFooterItems: MenuItem[] = [
  {
    name: "Teams",
    href: "/teams",
    icon: "hugeicons:user-group-03",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: "hugeicons:settings-02",
  },
];

export const routeLabels: Record<string, string> = {
  "/overview": "Overview",
  "/socials": "Socials",
  "/socials/accounts": "Accounts",
  "/socials/videos": "Videos",
  "/socials/trends": "Trends",
  "/links": "Links",
  "/analytics": "Analytics",
  "/agent-api": "Agent & API",
  "/teams": "Teams",
  "/settings": "Settings",
};
