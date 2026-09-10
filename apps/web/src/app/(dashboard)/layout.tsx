import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardShellSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { hexclaveServerApp } from "@/hexclave/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardShellSkeleton />}>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}

async function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await hexclaveServerApp.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.selectedTeam) {
    redirect("/created-org");
  }

  return (
    <DashboardShell
      user={{
        displayName: user.displayName,
        primaryEmail: user.primaryEmail,
        profileImageUrl: user.profileImageUrl,
      }}
    >
      {children}
    </DashboardShell>
  );
}
