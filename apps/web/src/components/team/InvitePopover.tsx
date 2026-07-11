"use client";

import type { Team } from "@hexclave/next";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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

export function InvitePopover({ team }: { team: Team }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSending(true);

    try {
      await team.inviteUser({ email: email.trim() });
      await queryClient.invalidateQueries({ queryKey: ["team-data", team.id] });
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
              onChange={setEmail}
            >
              <Label>Email address</Label>
              <Input autoComplete="email" placeholder="teammate@company.com" />
              <Description>Hexclave will email a team invitation.</Description>
            </TextField>

            <div className="flex justify-end">
              <Button
                isDisabled={!email.trim() || isSending}
                isPending={isSending}
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
