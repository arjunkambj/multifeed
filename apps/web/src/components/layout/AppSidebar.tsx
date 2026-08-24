"use client";

import { SearchIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Icon } from "@iconify/react";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd, KbdGroup, useMetaKeyLabel } from "@/components/ui/kbd";
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
  const [searchOpen, setSearchOpen] = useState(false);
  const metaKey = useMetaKeyLabel();

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
      <SidebarHeader className="gap-2 p-2 group-data-[collapsible=icon]:items-center">
        <Link
          aria-label="MultiFeed"
          className="flex items-center px-1 py-1 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          href="/overview"
        >
          <Logo markOnly markClassName="size-7" />
        </Link>
        <InputGroup
          className="h-8 w-full min-w-0 cursor-pointer rounded-lg group-data-[collapsible=icon]:hidden"
          onClick={() => setSearchOpen(true)}
        >
          <InputGroupAddon>
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
          </InputGroupAddon>
          <InputGroupInput
            readOnly
            aria-label="Search"
            placeholder="Search"
            onMouseDown={(event) => event.preventDefault()}
          />
          <InputGroupAddon align="inline-end" className="shrink-0">
            <KbdGroup>
              <Kbd>{metaKey}</Kbd>
              <Kbd>{SEARCH_SHORTCUT.toUpperCase()}</Kbd>
            </KbdGroup>
          </InputGroupAddon>
        </InputGroup>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label="Search"
                className="hidden size-9 group-data-[collapsible=icon]:flex"
                size="icon-sm"
                variant="ghost"
                onClick={() => setSearchOpen(true)}
              />
            }
          >
            <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent side="right">
            Search
            <KbdGroup>
              <Kbd>{metaKey}</Kbd>
              <Kbd>{SEARCH_SHORTCUT.toUpperCase()}</Kbd>
            </KbdGroup>
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
