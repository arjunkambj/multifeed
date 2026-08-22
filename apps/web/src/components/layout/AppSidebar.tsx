"use client";

import { SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  sidebarCategories,
  sidebarFooterItems,
  sidebarMainItems,
} from "@/constants/sidebar-menu";
import type { MenuItem } from "@/constants/sidebar-menu";
import Logo from "./Logo";

const searchGroups = [
  { heading: undefined, items: sidebarMainItems },
  ...sidebarCategories.map((category) => ({
    heading: category.name,
    items: category.items,
  })),
  { heading: "Workspace", items: sidebarFooterItems },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (item: MenuItem) =>
    pathname === item.href ||
    (item.href === "/posts" &&
      pathname.startsWith("/posts/") &&
      pathname !== "/posts/new");

  const goTo = (href: MenuItem["href"]) => {
    setSearchOpen(false);
    router.push(href);
  };

  const renderItems = (items: MenuItem[]) =>
    items.map((item) => (
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
    ));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="flex h-14 flex-row items-center gap-1 border-b border-border px-2 py-0 group-data-[collapsible=icon]:justify-center">
        <Link
          aria-label="MultiFeed"
          className="flex h-8 items-center px-2 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          href="/overview"
        >
          <Logo markOnly markClassName="size-4" />
        </Link>
        <Button
          aria-label="Search"
          className="ml-auto group-data-[collapsible=icon]:hidden"
          size="icon-sm"
          variant="ghost"
          onClick={() => setSearchOpen(true)}
        >
          <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
        </Button>
      </SidebarHeader>

      <CommandDialog
        description="Jump to a page in MultiFeed."
        open={searchOpen}
        title="Search"
        onOpenChange={setSearchOpen}
      >
        <Command>
          <CommandInput placeholder="Search" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            {searchGroups.map((group) => (
              <CommandGroup
                heading={group.heading}
                key={group.heading ?? "main"}
              >
                {group.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`${item.name} ${group.heading ?? ""}`}
                    onSelect={() => goTo(item.href)}
                  >
                    <Icon icon={item.icon} width={16} />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(sidebarMainItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {sidebarCategories.map((category) => (
          <SidebarGroup key={category.name}>
            <SidebarGroupLabel>{category.name}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{renderItems(category.items)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>{renderItems(sidebarFooterItems)}</SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
