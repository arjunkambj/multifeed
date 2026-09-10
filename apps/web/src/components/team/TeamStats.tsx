import { countUsedTeamSeats } from "@/lib/team-seats";

function KpiCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl bg-muted px-5 py-3.5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold leading-none text-foreground">
        {value}
      </p>
    </div>
  );
}

export function TeamStats({
  invitationsCount,
  membersCount,
  teamSeatLimit,
}: {
  invitationsCount: number;
  membersCount: number;
  teamSeatLimit: number | undefined;
}) {
  const usedSeats = countUsedTeamSeats(membersCount, invitationsCount);

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <KpiCard label="Members" value={membersCount} />
      <KpiCard label="Pending invites" value={invitationsCount} />
      <KpiCard
        label="Plan seats used"
        value={
          teamSeatLimit === undefined
            ? "—"
            : `${usedSeats} / ${teamSeatLimit}`
        }
      />
    </section>
  );
}
