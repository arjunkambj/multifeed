"use client";

import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import type { ProfileUser } from "@/components/layout/UserProfileMenu";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: ProfileUser;
}) {
  return (
    <TooltipProvider>
      <SidebarProvider className="bg-background">
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <SidebarInset className="overflow-hidden">
          <DashboardHeader user={user} />
          <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-3 sm:px-6 sm:py-3">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
