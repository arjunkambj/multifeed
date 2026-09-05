import {
  Calendar03Icon,
  ConnectIcon,
  CreditCardIcon,
  DashboardSquareSettingIcon,
  FileAddIcon,
  Home03Icon,
  Layers01Icon,
  Settings02Icon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { Route } from "next";

export interface MenuItem {
  name: string;
  href: Route;
  icon: IconSvgElement;
}

export interface MenuCategory {
  name: string;
  icon: IconSvgElement;
  items: MenuItem[];
}

export const sidebarMainItems: MenuItem[] = [
  {
    name: "Overview",
    href: "/overview",
    icon: Home03Icon,
  },
];

export const sidebarCategories: MenuCategory[] = [
  {
    name: "Social",
    icon: Calendar03Icon,
    items: [
      {
        name: "New Post",
        href: "/posts/new",
        icon: FileAddIcon,
      },
      {
        name: "Calendar",
        href: "/calendar",
        icon: Calendar03Icon,
      },
      {
        name: "All Posts",
        href: "/posts",
        icon: Layers01Icon,
      },
    ],
  },
  {
    name: "Manager",
    icon: DashboardSquareSettingIcon,
    items: [
      {
        name: "Connections",
        href: "/connections",
        icon: ConnectIcon,
      },
      {
        name: "Team",
        href: "/teams",
        icon: UserGroup03Icon,
      },
    ],
  },
];

export const sidebarFooterItems: MenuItem[] = [
  {
    name: "Billing",
    href: "/billing",
    icon: CreditCardIcon,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings02Icon,
  },
];
