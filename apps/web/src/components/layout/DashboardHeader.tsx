"use client";

import { UserProfileMenu } from "@/components/layout/UserProfileMenu";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 sm:px-6">
      <SidebarTrigger />
      <div className="ml-auto flex items-center justify-end">
        <UserProfileMenu />
      </div>
    </header>
  );
}
