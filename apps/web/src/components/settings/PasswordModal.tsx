"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Label,
  Modal,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useUser } from "@hexclave/next";

export function PasswordModal() {
  const user = useUser({ or: "redirect" });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSaving(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) reset();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (newPassword.length < 8) {
      toast.danger("Use at least 8 characters for your new password.", {
        timeout: 3000,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.danger("New password and confirmation must match.", {
        timeout: 3000,
      });
      return;
    }

    setIsSaving(true);
    try {
      if (user.hasPassword) {
        await user.updatePassword({
          oldPassword: currentPassword,
          newPassword,
        });
      } else {
        await user.setPassword({ password: newPassword });
      }
      setIsOpen(false);
      reset();
      toast.success("Password updated.", { timeout: 3000 });
    } catch (caught) {
      setIsSaving(false);
      toast.danger(caught instanceof Error ? caught.message : String(caught), {
        timeout: 3000,
      });
    }
  };

  const actionLabel = user.hasPassword ? "Change password" : "Set password";
  return (
    <Modal isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Button type="button" variant="tertiary">
        <Icon icon="solar:key-linear" className="size-4" />
        {actionLabel}
      </Button>
      <Modal.Backdrop
        variant="blur"
        isDismissable={!isSaving}
        isKeyboardDismissDisabled={isSaving}
      >
        <Modal.Container placement="center" size="sm">
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <form onSubmit={handleSubmit}>
              <Modal.Header>
                <Modal.Heading>{actionLabel}</Modal.Heading>
                <p className="text-sm leading-relaxed text-muted">
                  {user.hasPassword
                    ? "Confirm your current password, then choose a new one."
                    : "Choose a password for your account."}
                </p>
              </Modal.Header>

              <Modal.Body className="flex flex-col gap-4">
                {user.hasPassword && (
                  <TextField
                    autoFocus
                    fullWidth
                    isRequired
                    name="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                  >
                    <Label>Current password</Label>
                    <Input
                      className="w-full"
                      placeholder="Current password"
                      variant="secondary"
                    />
                  </TextField>
                )}

                <TextField
                  autoFocus={!user.hasPassword}
                  fullWidth
                  isRequired
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                >
                  <Label>New password</Label>
                  <Input
                    className="w-full"
                    placeholder="At least 8 characters"
                    variant="secondary"
                  />
                </TextField>

                <TextField
                  fullWidth
                  isRequired
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                >
                  <Label>Confirm new password</Label>
                  <Input
                    className="w-full"
                    placeholder="Repeat new password"
                    variant="secondary"
                  />
                </TextField>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  slot="close"
                  type="button"
                  variant="tertiary"
                  isDisabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isPending={isSaving}
                  isDisabled={
                    isSaving ||
                    !newPassword ||
                    !confirmPassword ||
                    (user.hasPassword && !currentPassword)
                  }
                >
                  {({ isPending }) => (
                    <>
                      {isPending && <Spinner color="current" size="sm" />}
                      {actionLabel}
                    </>
                  )}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
