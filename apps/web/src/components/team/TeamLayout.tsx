import type { TeamData } from "@/lib/team-data";
import { TeamSection } from "@/components/team/TeamSection";

export function TeamLayout(props: {
  canInviteMembers: boolean;
  canReadMembers: boolean;
  initialData?: TeamData;
  team: { id: string; displayName: string };
}) {
  return <TeamSection {...props} />;
}
