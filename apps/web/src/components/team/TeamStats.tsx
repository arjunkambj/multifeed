export function TeamStats({
  invitationsCount,
  membersCount,
  team,
}: {
  invitationsCount: number;
  membersCount: number;
  team: { id: string };
}) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-surface-secondary p-5">
        <p className="text-sm text-muted">Members</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">
          {membersCount}
        </p>
      </div>
      <div className="rounded-2xl bg-surface-secondary p-5">
        <p className="text-sm text-muted">Pending invites</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">
          {invitationsCount}
        </p>
      </div>
      <div className="rounded-2xl bg-surface-secondary p-5">
        <p className="text-sm text-muted">Org ID</p>
        <p className="mt-2 truncate font-mono text-sm font-medium text-foreground">
          {team.id}
        </p>
      </div>
    </section>
  );
}
