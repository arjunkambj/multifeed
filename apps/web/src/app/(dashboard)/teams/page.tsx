import { Suspense } from "react";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { TeamLayout } from "@/components/team";
import { requireDashboardSession } from "@/hexclave/dashboard-session";
import { loadServerTeamData } from "@/lib/team-data.server";

async function TeamsContent() {
  const { user, team, convexToken } = await requireDashboardSession();
  const [canReadMembers, canInviteMembers] = await Promise.all([
    user.hasPermission(team, "$read_members"),
    user.hasPermission(team, "$invite_members"),
  ]);
  const initialData = canReadMembers
    ? await loadServerTeamData(team, convexToken)
    : undefined;

  return (
    <TeamLayout
      canInviteMembers={canInviteMembers}
      canReadMembers={canReadMembers}
      initialData={initialData}
      team={{ id: team.id, displayName: team.displayName }}
    />
  );
}

export default function TeamsPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="teams" />}>
      <TeamsContent />
    </Suspense>
  );
}
