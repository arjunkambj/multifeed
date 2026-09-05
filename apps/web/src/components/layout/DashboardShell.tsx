"use client";

import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider className="bg-background">
        <Suspense fallback={null}>
          <AppSidebar />
        </Suspense>
        <SidebarInset className="overflow-hidden">
          <Suspense fallback={null}>
            <DashboardHeader />
          </Suspense>
          <div className="flex min-w-0 flex-1 flex-col gap-6 px-4 py-3 sm:px-6 sm:py-3">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
