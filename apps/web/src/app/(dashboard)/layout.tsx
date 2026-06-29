import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { hexclaveServerApp } from "@/hexclave/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await hexclaveServerApp.getUser();

  if (!user) {
    redirect("/sign-in");
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
