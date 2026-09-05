import type { Metadata } from "next";
import { AuthProviders } from "@/components/AuthProviders";
import { DashboardProviders } from "@/components/DashboardProviders";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProviders>
      <DashboardProviders>
        <DashboardShell>{children}</DashboardShell>
      </DashboardProviders>
    </AuthProviders>
  );
}
