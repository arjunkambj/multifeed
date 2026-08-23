"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { InvitePopover } from "@/components/team/InvitePopover";
import { TeamMembersContent } from "@/components/team/TeamMembersContent";
import { hexclaveClientApp } from "@/hexclave/client";

export function TeamSection() {
  const user = hexclaveClientApp.useUser({ or: "redirect" });
  const team = user.selectedTeam;
  const router = useRouter();
  const [canReadMembers, setCanReadMembers] = useState<boolean | null>(null);
  const [canInviteMembers, setCanInviteMembers] = useState(false);

  useEffect(() => {
    if (!team) {
      router.replace("/created-org");
    }
  }, [router, team]);

  useEffect(() => {
    if (!team) return;
    void Promise.all([
      user.hasPermission(team, "$read_members"),
      user.hasPermission(team, "$invite_members"),
    ]).then(([read, invite]) => {
      setCanReadMembers(read);
      setCanInviteMembers(invite);
    });
  }, [team, user]);

  if (!team || canReadMembers === null) {
    return <DashboardLoadingSkeleton variant="teams" />;
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <DashboardPageTitle
        title="Manage team"
        description={`Manage who can work inside ${team.displayName}.`}
        actions={
          canInviteMembers ? <InvitePopover teamId={team.id} /> : undefined
        }
      />

      {canReadMembers ? (
        <TeamMembersContent teamId={team.id} />
      ) : (
        <div className="rounded-4xl border border-border bg-background/40 p-5 text-sm text-muted-foreground">
          You do not have permission to read team members.
        </div>
      )}
    </div>
  );
}
