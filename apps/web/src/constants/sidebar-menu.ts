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
    name: "Social",
    icon: "hugeicons:calendar-03",
    items: [
      {
        name: "New Post",
        href: "/posts/new",
        icon: "hugeicons:file-add",
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: "hugeicons:calendar-03",
      },
      {
        name: "All Posts",
        href: "/posts",
        icon: "hugeicons:layers-01",
      },
    ],
  },
  {
    name: "Manager",
    icon: "hugeicons:dashboard-square-setting",
    items: [
      {
        name: "Connections",
        href: "/connections",
        icon: "hugeicons:connect",
      },
      {
        name: "Team",
        href: "/teams",
        icon: "hugeicons:user-group-03",
      },
    ],
  },
];

export const sidebarFooterItems: MenuItem[] = [
  {
    name: "Billing",
    href: "/billing",
    icon: "solar:card-linear",
  },
  {
    name: "Settings",
    href: "/settings",
    icon: "hugeicons:settings-02",
  },
];
