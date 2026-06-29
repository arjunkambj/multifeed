"use client";

import type { Team } from "@hexclave/next";

import { useUser } from "@hexclave/next";
import { InvitePopover } from "@/components/team/InvitePopover";
import { TeamMembersContent } from "@/components/team/TeamMembersContent";

export function TeamSection({ team }: { team: Team }) {
  const user = useUser({ or: "redirect" });
  const canReadMembers = user.usePermission(team, "$read_members");
  const canInviteMembers = user.usePermission(team, "$invite_members");

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-2xl font-semibold text-foreground">
              Manage team
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              Manage who can work inside {team.displayName}.
            </p>
          </div>
        </div>
        {canInviteMembers && <InvitePopover team={team} />}
      </header>

      {canReadMembers ? (
        <TeamMembersContent team={team} />
      ) : (
        <div className="rounded-4xl border border-border bg-background/40 p-5 text-sm text-muted">
          You do not have permission to read team members.
        </div>
      )}
    </div>
  );
}
