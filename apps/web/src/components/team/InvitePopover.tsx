"use client";

import type { Team } from "@hexclave/next";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  Popover,
  Spinner,
  TextField,
} from "@heroui/react";
import { Icon } from "@iconify/react";

export function InvitePopover({ team }: { team: Team }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("sending");

    try {
      await team.inviteUser({ email: email.trim() });
      await queryClient.invalidateQueries({ queryKey: ["team-data", team.id] });
      setStatus("sent");
      setEmail("");
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Popover onOpenChange={() => setError("")}>
      <Button>
        <Icon icon="hugeicons:user-add-02" className="size-4" />
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
              onChange={(value) => {
                setEmail(value);
                setStatus("idle");
              }}
            >
              <Label>Email address</Label>
              <Input
                autoComplete="email"
                placeholder="teammate@company.com"
                variant="secondary"
              />
              <Description>Hexclave will email a team invitation.</Description>
            </TextField>

            {error && (
              <FieldError className="rounded-2xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm">
                {error}
              </FieldError>
            )}

            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-success">
                {status === "sent" ? "Invite sent" : ""}
              </span>
              <Button
                isDisabled={!email.trim() || status === "sending"}
                isPending={status === "sending"}
                type="submit"
              >
                {({ isPending }) => (
                  <>
                    {isPending ? (
                      <Spinner color="current" size="sm" />
                    ) : (
                      <Icon icon="hugeicons:mail-send-02" className="size-4" />
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
