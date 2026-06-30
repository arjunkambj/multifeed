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
      {
        name: "Studio",
        href: "/studio",
        icon: "hugeicons:magic-wand-01",
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
        name: "All Posts",
        href: "/posts",
        icon: "hugeicons:list-view",
      },
      {
        name: "Scheduled",
        href: "/posts/scheduled",
        icon: "hugeicons:calendar-check-in-01",
      },
      {
        name: "Published",
        href: "/posts/published",
        icon: "hugeicons:task-done-01",
      },
      {
        name: "Drafts",
        href: "/posts/drafts",
        icon: "hugeicons:file-02",
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
      {
        name: "Analytics",
        href: "/analytics",
        icon: "hugeicons:analytics-01",
      },
      {
        name: "Inbox",
        href: "/inbox",
        icon: "hugeicons:inbox",
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
  "/studio": "Studio",
  "/calendar": "Calendar",
  "/posts": "All Posts",
  "/posts/scheduled": "Scheduled",
  "/posts/published": "Published",
  "/posts/drafts": "Drafts",
  "/connections": "Connections",
  "/analytics": "Analytics",
  "/inbox": "Inbox",
  "/teams": "Team",
  "/settings": "Settings",
};
