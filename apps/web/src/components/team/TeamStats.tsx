export function TeamStats({
  invitationsCount,
  membersCount,
  teamSeatLimit,
}: {
  invitationsCount: number;
  membersCount: number;
  teamSeatLimit: number | undefined;
}) {
  const usedSeats = invitationsCount + membersCount;

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
        <p className="text-sm text-muted">Plan seats used</p>
        <p className="mt-2 text-2xl font-semibold text-foreground">
          {teamSeatLimit === undefined
            ? "—"
            : `${usedSeats} / ${teamSeatLimit}`}
        </p>
      </div>
    </section>
  );
}
