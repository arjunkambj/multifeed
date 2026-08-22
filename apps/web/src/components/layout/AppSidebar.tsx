"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  sidebarCategories,
  sidebarFooterItems,
  sidebarMainItems,
} from "@/constants/sidebar-menu";
import type { MenuItem } from "@/constants/sidebar-menu";
import Logo from "./Logo";

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (item: MenuItem) =>
    pathname === item.href ||
    (item.href === "/posts" &&
      pathname.startsWith("/posts/") &&
      pathname !== "/posts/new");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader>
        <div className="flex h-12 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Logo markOnly={collapsed} />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {(
          [
            { items: sidebarMainItems },
            ...sidebarCategories.map(({ name, items }) => ({ name, items })),
          ] as { name?: string; items: MenuItem[] }[]
        ).map(({ name, items }) => (
          <SidebarGroup key={name ?? "main"}>
            {name && <SidebarGroupLabel>{name}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      isActive={isActive(item)}
                      render={<Link href={item.href} />}
                      tooltip={item.name}
                    >
                      <Icon icon={item.icon} width={18} />
                      <span>{item.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {sidebarFooterItems.map((item) => (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                isActive={isActive(item)}
                render={<Link href={item.href} />}
                tooltip={item.name}
              >
                <Icon icon={item.icon} width={18} />
                <span>{item.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
