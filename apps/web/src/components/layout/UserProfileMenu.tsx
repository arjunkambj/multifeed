"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { hexclaveClientApp } from "@/hexclave/client";

const menuRoutes = {
  settings: "/settings",
} as const;

type ProfileUser = {
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
};

const getInitials = (value: string | null) =>
  value
    ?.split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function UserProfileMenu({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const initials =
    getInitials(user.displayName) || getInitials(user.primaryEmail);
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user profile"
        className="group size-9 cursor-pointer rounded-full border border-border bg-card p-0 items-center flex justify-center transition-colors hover:border-primary/40 hover:bg-muted"
      >
        <Avatar className="size-7.5 rounded-full">
          {user.profileImageUrl && (
            <AvatarImage
              src={user.profileImageUrl}
              alt={user.displayName ?? ""}
            />
          )}
          <AvatarFallback className="text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 rounded-4xl py-2" align="end">
        <div className="flex items-center gap-2 px-2  py-2 ">
          <Avatar className="size-10 rounded-full">
            {user.profileImageUrl && (
              <AvatarImage
                src={user.profileImageUrl}
                alt={user.displayName ?? ""}
              />
            )}
            <AvatarFallback className="text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {user.displayName && (
              <div className="truncate text-sm font-semibold text-foreground">
                {user.displayName}
              </div>
            )}
            {user.primaryEmail && (
              <div className="truncate text-xs text-muted-foreground">
                {user.primaryEmail}
              </div>
            )}
          </div>
        </div>
        <div
          className="pt-1 flex flex-col gap-0"
          onClick={(event) => event.stopPropagation()}
        >
          <DropdownMenuItem
            className="select-none"
            onSelect={(event) => event.preventDefault()}
          >
            <Icon icon="hugeicons:sun-03" width={20} />
            <Label>Dark mode</Label>
            <Switch
              aria-label="Toggle dark mode"
              className="ml-auto"
              checked={isDark}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              router.push(menuRoutes.settings);
            }}
          >
            <Icon icon="hugeicons:settings-02" width={20} />
            <Label>Settings</Label>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              void hexclaveClientApp.signOut();
            }}
          >
            <Icon icon="hugeicons:logout-03" width={20} />
            <Label>Logout</Label>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
