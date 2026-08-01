import { DashboardShell } from "@/components/layout/DashboardShell";
import { requireDashboardSession } from "@/hexclave/dashboard-session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireDashboardSession();

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
