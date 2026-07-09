"use client";

import { useState } from "react";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: {
    displayName: string | null;
    primaryEmail: string | null;
    profileImageUrl: string | null;
  };
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      <AppSidebar collapsed={collapsed} />
      <div className="my-2 mr-2 flex min-w-0 border flex-1 flex-col overflow-hidden rounded-4xl bg-surface">
        <DashboardHeader
          user={user}
          onToggle={() => setCollapsed((value) => !value)}
        />
        <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
