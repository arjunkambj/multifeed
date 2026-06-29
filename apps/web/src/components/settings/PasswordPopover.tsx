"use client";

import { useState } from "react";
import {
  Button,
  FieldError,
  Input,
  Label,
  Popover,
  Spinner,
  TextField,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useUser } from "@hexclave/next";

export function PasswordPopover() {
  const user = useUser({ or: "redirect" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation must match.");
      return;
    }

    setStatus("saving");

    try {
      if (user.hasPassword) {
        await user.updatePassword({
          oldPassword: currentPassword,
          newPassword,
        });
      } else {
        await user.setPassword({ password: newPassword });
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("saved");
      setIsOpen(false);
    } catch (err) {
      setStatus("idle");
      setError(String(err));
    }
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <Button type="button" variant="tertiary">
          <Icon icon="solar:key-linear" className="size-4" />
          {user.hasPassword ? "Change password" : "Set password"}
        </Button>
      </Popover.Trigger>
      <Popover.Content className="w-[420px]" placement="right">
        <Popover.Dialog className="flex flex-col gap-4 p-4">
          <Popover.Heading className="font-heading text-lg font-semibold text-foreground">
            {user.hasPassword ? "Change password" : "Set password"}
          </Popover.Heading>

          <div className="flex flex-col gap-4">
            {user.hasPassword && (
              <TextField
                fullWidth
                isRequired
                name="currentPassword"
                type="password"
                variant="secondary"
                value={currentPassword}
                onChange={setCurrentPassword}
              >
                <Label>Old password</Label>
                <Input className="w-full" placeholder="Old password" />
              </TextField>
            )}

            <TextField
              fullWidth
              isRequired
              name="newPassword"
              type="password"
              variant="secondary"
              value={newPassword}
              onChange={setNewPassword}
            >
              <Label>New password</Label>
              <Input className="w-full" placeholder="New password" />
            </TextField>

            <TextField
              fullWidth
              isRequired
              name="confirmPassword"
              type="password"
              variant="secondary"
              value={confirmPassword}
              onChange={setConfirmPassword}
            >
              <Label>Confirm new password</Label>
              <Input className="w-full" placeholder="Confirm new password" />
            </TextField>
          </div>

          {error && (
            <FieldError className="rounded-2xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm">
              {error}
            </FieldError>
          )}

          <Button
            isDisabled={
              status === "saving" ||
              !newPassword ||
              !confirmPassword ||
              (user.hasPassword && !currentPassword)
            }
            isPending={status === "saving"}
            type="button"
            variant="tertiary"
            onPress={handleSubmit}
          >
            {({ isPending }) => (
              <>
                {isPending ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <Icon icon="solar:key-linear" className="size-4" />
                )}
                {user.hasPassword ? "Change password" : "Set password"}
              </>
            )}
          </Button>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}
