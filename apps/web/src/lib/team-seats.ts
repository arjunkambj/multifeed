/** Paid team seats exclude the workspace owner and include pending invitations. */
export const countUsedTeamSeats = (
  membersCount: number,
  invitationsCount: number,
) => Math.max(0, membersCount - 1) + invitationsCount;
