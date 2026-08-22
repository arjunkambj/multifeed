"use client";

import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hexclaveClientApp } from "@/hexclave/client";

const getInitials = (value: string | null) =>
  value
    ?.split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function UserProfileMenu() {
  const user = hexclaveClientApp.useUser({ or: "redirect" });
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const initials =
    getInitials(user.displayName) || getInitials(user.primaryEmail);
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Open user profile"
        render={
          <Button className="rounded-full" size="icon-lg" variant="outline" />
        }
      >
        <Avatar className="size-7">
          {user.profileImageUrl && (
            <AvatarImage
              alt={user.displayName ?? ""}
              src={user.profileImageUrl}
            />
          )}
          <AvatarFallback className="text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <Avatar className="size-9">
            {user.profileImageUrl && (
              <AvatarImage
                alt={user.displayName ?? ""}
                src={user.profileImageUrl}
              />
            )}
            <AvatarFallback className="text-sm font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            {user.displayName && (
              <div className="truncate text-sm font-semibold">
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
        <DropdownMenuSeparator />
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="flex items-center gap-2 text-sm">
            <Icon icon="hugeicons:sun-03" width={16} />
            Theme
          </span>
          <Tabs
            className="ml-auto"
            onValueChange={(value) => setTheme(value as "light" | "dark")}
            value={isDark ? "dark" : "light"}
          >
            <TabsList className="h-7 justify-between">
              <TabsTrigger
                aria-label="Light mode"
                className="flex-none px-1.5"
                title="Light mode"
                value="light"
              >
                <Icon icon="hugeicons:sun-03" width={14} />
              </TabsTrigger>
              <TabsTrigger
                aria-label="Dark mode"
                className="flex-none px-1.5"
                title="Dark mode"
                value="dark"
              >
                <Icon icon="hugeicons:moon-02" width={14} />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Icon icon="hugeicons:settings-02" width={16} />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => void hexclaveClientApp.signOut()}
        >
          <Icon icon="hugeicons:logout-03" width={16} />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
