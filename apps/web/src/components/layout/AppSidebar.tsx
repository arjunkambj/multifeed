"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import {
  sidebarMainItems,
  sidebarCategories,
  sidebarFooterItems,
} from "@/constants/sidebar-menu";
import type { MenuItem } from "@/constants/sidebar-menu";
import Logo from "./Logo";

type SidebarSection = {
  name?: string;
  items: MenuItem[];
};

const collapsedRailSlot =
  "mx-auto flex size-10 items-center justify-center px-0";

const NavItem = ({
  item,
  active,
  collapsed,
}: {
  item: MenuItem;
  active: boolean;
  collapsed: boolean;
}) => (
  <Link
    href={item.href}
    title={collapsed ? item.name : undefined}
    className={`flex items-center gap-3 rounded-[0.75rem] text-sm transition-colors ${
      collapsed ? collapsedRailSlot : "h-9 px-3"
    } ${active ? "bg-accent/10 font-medium" : "hover:bg-surface-secondary"}`}
  >
    <Icon
      icon={item.icon}
      className={`size-[18px] shrink-0 ${active ? "[stroke-width:2]" : ""}`}
    />
    {!collapsed && <span>{item.name}</span>}
  </Link>
);

export function AppSidebar({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const sections: SidebarSection[] = [
    { items: sidebarMainItems },
    ...sidebarCategories.map(({ name, items }) => ({ name, items })),
  ];

  return (
    <aside
      className={`sticky top-0 flex h-dvh px-1 shrink-0 flex-col bg-background transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-62"
      }`}
    >
      <div
        className={`mt-2 flex h-16 items-center ${
          collapsed ? "justify-center px-0" : "px-3"
        }`}
      >
        <div
          className={`overflow-hidden${collapsed ? " flex size-10 items-center justify-center" : ""}`}
        >
          <Logo
            className={collapsed ? "justify-center" : undefined}
            markOnly={collapsed}
          />
        </div>
      </div>

      <div
        className={`flex-1 overflow-y-auto py-3 ${collapsed ? "px-0" : "px-2"}`}
      >
        {sections.map((section, index) => (
          <section
            key={section.name ?? "main"}
            className={index === 0 ? "" : "pt-4"}
          >
            {section.name && !collapsed && (
              <div className="px-3 pb-1.5 text-xs font-medium uppercase tracking-wider text-muted">
                {section.name}
              </div>
            )}
            <nav className="space-y-1">
              {section.items.map((item) => (
                <NavItem
                  key={item.name}
                  item={item}
                  active={pathname === item.href}
                  collapsed={collapsed}
                />
              ))}
            </nav>
          </section>
        ))}
      </div>

      <div className="border-t border-border p-2">
        <nav className="space-y-1">
          {sidebarFooterItems.map((item) => (
            <NavItem
              key={item.name}
              item={item}
              active={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}
