"use client";

import { Search } from "@honeyicons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import { MetaKbd } from "@/components/ui/kbd";
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MenuItem } from "@/constants/sidebar-menu";
import {
  sidebarCategories,
  sidebarFooterItems,
  sidebarMainItems,
} from "@/constants/sidebar-menu";
import Logo from "./Logo";

const searchGroups = [
  { heading: undefined, items: sidebarMainItems },
  ...sidebarCategories.map((category) => ({
    heading: category.name,
    items: category.items,
  })),
  { heading: "Workspace", items: sidebarFooterItems },
];

const SEARCH_SHORTCUT = "k";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === SEARCH_SHORTCUT
      ) {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (item: MenuItem) =>
    pathname === item.href ||
    (item.href === "/posts" &&
      pathname.startsWith("/posts/") &&
      pathname !== "/posts/new");

  const goTo = (href: MenuItem["href"]) => {
    setSearchOpen(false);
    setOpenMobile(false);
    router.push(href);
  };

  const renderItems = (items: MenuItem[]) =>
    items.map((item) => (
      <SidebarMenuItem key={item.name}>
        <SidebarMenuButton
          isActive={isActive(item)}
          aria-current={isActive(item) ? "page" : undefined}
          onClick={() => setOpenMobile(false)}
          render={<Link href={item.href} />}
          tooltip={item.name}
        >
          <item.icon strokeWidth={2} />
          <span>{item.name}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="group-data-[collapsible=icon]:items-center">
        <Link
          aria-label="MultiFeed"
          className="flex items-center px-1 py-1 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          href="/overview"
          onClick={() => setOpenMobile(false)}
        >
          <Logo markOnly markClassName="size-7" />
        </Link>
        <Button
          variant="secondary"
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          className="w-full min-w-0 justify-start rounded-full group-data-[collapsible=icon]:hidden"
          onClick={() => setSearchOpen(true)}
        >
          <Search strokeWidth={2} data-icon="inline-start" />
          Search
          <span className="ml-auto">
            <MetaKbd shortcut={SEARCH_SHORTCUT} />
          </span>
        </Button>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Search"
                className="hidden group-data-[collapsible=icon]:flex"
                size="icon-lg"
                variant="ghost"
                onClick={() => setSearchOpen(true)}
              />
            }
          >
            <Search strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent side="right">
            Search
            <MetaKbd shortcut={SEARCH_SHORTCUT} />
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>

      <CommandDialog
        description="Jump to a page in MultiFeed."
        open={searchOpen}
        title="Search"
        onOpenChange={setSearchOpen}
      >
        <Command>
          <CommandInput aria-label="Search pages" placeholder="Search" />
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
                    <item.icon strokeWidth={2} />
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
