"use client";

import type { Team } from "@hexclave/next";
import { Icon } from "@iconify/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { countUsedTeamSeats } from "@/lib/team-seats";

export function InviteModal({
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
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const sendingRef = useRef(false);
  const usedSeats = countUsedTeamSeats(membersCount, invitationsCount);
  const isAtLimit = teamSeatLimit !== undefined && usedSeats >= teamSeatLimit;

  const reset = () => {
    setEmail("");
    setIsSending(false);
    sendingRef.current = false;
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) reset();
  };

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
        setIsOpen(false);
        reset();
        toast.success("Invite sent.");
      })
      .catch((err) => {
        sendingRef.current = false;
        setIsSending(false);
        toast.error(err instanceof Error ? err.message : String(err));
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Icon icon="hugeicons:user-add-02" width={16} />
        Invite member
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleInvite}>
          <DialogHeader>
            <DialogTitle>Invite teammate</DialogTitle>
            <DialogDescription>
              Hexclave will email a team invitation.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                placeholder="teammate@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              {teamSeatLimit !== undefined && (
                <p className="text-sm text-muted-foreground">
                  {usedSeats} of {teamSeatLimit} plan seats used
                  {isAtLimit
                    ? ". Upgrade your plan to invite more people."
                    : "."}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
