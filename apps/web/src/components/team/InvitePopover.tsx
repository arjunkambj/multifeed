"use client";

import type { Team } from "@hexclave/next";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";
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
import { countUsedTeamSeats } from "@/lib/team-seats";

export function InvitePopover({
  invitationsCount,
  membersCount,
  team,
  teamSeatLimit,
}: {
  invitationsCount: number;
  membersCount: number;
  team: Team;
  teamSeatLimit: number | undefined;
}) {
  "use no memo";

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const usedSeats = countUsedTeamSeats(membersCount, invitationsCount);
  const isAtLimit = teamSeatLimit !== undefined && usedSeats >= teamSeatLimit;

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
        const payload = (await response.json().catch(() => ({}))) as
          | { ok: true }
          | { error?: string };
        if (!response.ok || !("ok" in payload)) {
          throw new Error(
            "error" in payload && payload.error
              ? payload.error
              : "Could not send team invitation",
          );
        }
        await team.listInvitations();
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
            {teamSeatLimit !== undefined && (
              <p className="text-sm text-muted-foreground">
                {usedSeats} of {teamSeatLimit} plan seats used
                {isAtLimit ? ". Upgrade your plan to invite more people." : "."}
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
