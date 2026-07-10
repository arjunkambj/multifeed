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
    name: "Create",
    icon: "hugeicons:edit-02",
    items: [
      {
        name: "New Post",
        href: "/posts/new",
        icon: "hugeicons:file-add",
      },
    ],
  },
  {
    name: "Posts",
    icon: "hugeicons:calendar-03",
    items: [
      {
        name: "Calendar",
        href: "/calendar",
        icon: "hugeicons:calendar-03",
      },
      {
        name: "Scheduled",
        href: "/posts/scheduled",
        icon: "hugeicons:calendar-check-in-01",
      },
      {
        name: "Posted",
        href: "/posts/posted",
        icon: "hugeicons:checkmark-circle-02",
      },
      {
        name: "Drafts",
        href: "/posts/drafts",
        icon: "hugeicons:note-01",
      },
    ],
  },
  {
    name: "Manage",
    icon: "hugeicons:dashboard-square-setting",
    items: [
      {
        name: "Connections",
        href: "/connections",
        icon: "hugeicons:connect",
      },
    ],
  },
];

export const sidebarFooterItems: MenuItem[] = [
  {
    name: "Team",
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
  "/posts/new": "New Post",
  "/calendar": "Calendar",
  "/posts/scheduled": "Scheduled",
  "/posts/posted": "Posted",
  "/posts/drafts": "Drafts",
  "/connections": "Connections",
  "/teams": "Team",
  "/settings": "Settings",
};
