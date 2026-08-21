"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
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
  "use no memo";

  const queryClient = useQueryClient();
  const teamDataQuery = useQuery({
    initialData,
    queryFn: loadTeamData,
    queryKey: teamDataQueryKey(teamId),
  });
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const membersCount = teamDataQuery.data?.members.length ?? 0;
  const invitationsCount = teamDataQuery.data?.invitations.length ?? 0;
  const seatLimit = teamDataQuery.data?.entitlements.teamSeatLimit;
  const usedSeats = countUsedTeamSeats(membersCount, invitationsCount);
  const isAtLimit = seatLimit !== undefined && usedSeats >= seatLimit;

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sendingRef.current) return;
    sendingRef.current = true;
    setIsSending(true);

    void fetch("/api/team-members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not send team invitation");
        const payload = (await response.json()) as
          | { ok: true }
          | { error: string };
        if (!("ok" in payload)) {
          throw new Error(
            "error" in payload
              ? payload.error
              : "Could not send team invitation",
          );
        }
        await queryClient.invalidateQueries({
          queryKey: teamDataQueryKey(teamId),
        });
        setEmail("");
        toast.success("Invite sent.");
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        sendingRef.current = false;
        setIsSending(false);
      });
  };

  return (
    <Popover>
      <PopoverTrigger render={<Button />}>
        <Icon icon="hugeicons:user-add-02" width={16} />
        Invite member
      </PopoverTrigger>
      <PopoverContent className="w-90" align="end">
        <div className="text-base font-semibold text-foreground">
          Invite teammate
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleInvite}>
          <div className="flex w-full flex-col gap-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="teammate@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Hexclave will email a team invitation.
            </p>
            {seatLimit !== undefined && (
              <p className="text-sm text-muted-foreground">
                {usedSeats} of {seatLimit} plan seats used
                {isAtLimit
                  ? ". Upgrade your plan to invite more people."
                  : "."}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              disabled={!email.trim() || isSending || isAtLimit}
              type="submit"
            >
              {isSending ? (
                <Spinner className="size-4" />
              ) : (
                <Icon icon="hugeicons:mail-send-02" width={16} />
              )}
              Send invite
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
