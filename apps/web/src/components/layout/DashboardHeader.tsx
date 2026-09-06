"use client";

import { Suspense } from "react";
import { UserProfileMenu } from "@/components/layout/UserProfileMenu";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 sm:px-6">
      <SidebarTrigger />
      <div className="ml-auto flex items-center justify-end">
        <Suspense
          fallback={
            <Skeleton
              aria-label="Loading profile"
              className="size-8 rounded-full"
            />
          }
        >
          <UserProfileMenu />
        </Suspense>
      </div>
    </header>
  );
}
