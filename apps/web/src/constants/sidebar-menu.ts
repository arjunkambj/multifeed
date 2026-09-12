import {
  Calendar,
  Card,
  FileAdd,
  Home,
  Integration,
  Layers,
  Settings,
  UserGroup,
  Widget,
  type HoneyIcon,
} from "@honeyicons/react";
import type { Route } from "next";

export interface MenuItem {
  name: string;
  href: Route;
  icon: HoneyIcon;
}

export interface MenuCategory {
  name: string;
  icon: HoneyIcon;
  items: MenuItem[];
}

export const sidebarMainItems: MenuItem[] = [
  {
    name: "Overview",
    href: "/overview",
    icon: Home,
  },
];

export const sidebarCategories: MenuCategory[] = [
  {
    name: "Social",
    icon: Calendar,
    items: [
      {
        name: "New Post",
        href: "/posts/new",
        icon: FileAdd,
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: Calendar,
      },
      {
        name: "All Posts",
        href: "/posts",
        icon: Layers,
      },
    ],
  },
  {
    name: "Manager",
    icon: Widget,
    items: [
      {
        name: "Connections",
        href: "/connections",
        icon: Integration,
      },
      {
        name: "Team",
        href: "/teams",
        icon: UserGroup,
      },
    ],
  },
];

export const sidebarFooterItems: MenuItem[] = [
  {
    name: "Billing",
    href: "/billing",
    icon: Card,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];
