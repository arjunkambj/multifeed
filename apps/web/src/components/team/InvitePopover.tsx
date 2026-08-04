"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Description,
  Input,
  Label,
  Popover,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { loadTeamData, teamDataQueryKey, type TeamData } from "@/lib/team-data";
import { countUsedTeamSeats } from "@/lib/team-seats";

export function InvitePopover({
  initialData,
  teamId,
}: {
  initialData?: TeamData;
  teamId: string;
}) {
  const queryClient = useQueryClient();
  const teamDataQuery = useQuery({
    initialData,
    queryFn: loadTeamData,
    queryKey: teamDataQueryKey(teamId),
  });
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const membersCount = teamDataQuery.data?.members.length ?? 0;
  const invitationsCount = teamDataQuery.data?.invitations.length ?? 0;
  const seatLimit = teamDataQuery.data?.entitlements.teamSeatLimit;
  const usedSeats = countUsedTeamSeats(membersCount, invitationsCount);
  const isAtLimit = seatLimit !== undefined && usedSeats >= seatLimit;

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;
    setIsSending(true);

    try {
      const response = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        throw new Error("Could not send team invitation");
      }
      const payload = (await response.json()) as
        | { ok: true }
        | { error: string };

      if (!("ok" in payload)) {
        throw new Error(
          "error" in payload ? payload.error : "Could not send team invitation",
        );
      }

      await queryClient.invalidateQueries({
        queryKey: teamDataQueryKey(teamId),
      });
      setEmail("");
      toast.success("Invite sent.", { timeout: 3000 });
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : String(err), {
        timeout: 3000,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Popover>
      <Button>
        <Icon icon="hugeicons:user-add-02" width={16} />
        Invite member
      </Button>
      <Popover.Content className="w-90" placement="bottom end">
        <Popover.Dialog className="p-4">
          <Popover.Arrow />
          <Popover.Heading className="text-base font-semibold text-foreground">
            Invite teammate
          </Popover.Heading>
          <form className="mt-4 flex flex-col gap-4" onSubmit={handleInvite}>
            <TextField
              fullWidth
              isRequired
              name="email"
              type="email"
              value={email}
              onChange={setEmail}
            >
              <Label>Email address</Label>
              <Input autoComplete="email" placeholder="teammate@company.com" />
              <Description>Hexclave will email a team invitation.</Description>
              {seatLimit !== undefined && (
                <Description>
                  {usedSeats} of {seatLimit} plan seats used
                  {isAtLimit
                    ? ". Upgrade your plan to invite more people."
                    : "."}
                </Description>
              )}
            </TextField>

            <div className="flex justify-end">
              <Button
                isDisabled={!email.trim() || isSending || isAtLimit}
                isPending={isSending}
                type="submit"
              >
                {({ isPending }) => (
                  <>
                    {isPending ? (
                      <Spinner color="current" size="sm" />
                    ) : (
                      <Icon icon="hugeicons:mail-send-02" width={16} />
                    )}
                    Send invite
                  </>
                )}
              </Button>
            </div>
          </form>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
