"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Description,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useUser } from "@hexclave/next";
import { PasswordModal } from "@/components/settings/PasswordModal";

const cleanOptional = (value: string) => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

export function GeneralSettingsForm() {
  const user = useUser({ or: "redirect" });
  const organization = user.selectedTeam;
  const [displayName, setDisplayName] = useState(user.displayName ?? "");
  const [email, setEmail] = useState(user.primaryEmail ?? "");
  const [organizationName, setOrganizationName] = useState(
    organization?.displayName ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = useMemo(
    () =>
      displayName.trim() !== (user.displayName ?? "") ||
      email.trim() !== (user.primaryEmail ?? "") ||
      organizationName.trim() !== (organization?.displayName ?? ""),
    [
      displayName,
      email,
      organization?.displayName,
      organizationName,
      user.displayName,
      user.primaryEmail,
    ],
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const updates = [
        user.update({
          displayName: cleanOptional(displayName),
          primaryEmail: cleanOptional(email),
        }),
      ];

      if (
        organization &&
        organizationName.trim() !== organization.displayName
      ) {
        updates.push(
          organization.update({ displayName: organizationName.trim() }),
        );
      }

      await Promise.all(updates);
      toast.success("Changes saved.", { timeout: 3000 });
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : String(err), {
        timeout: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      className="flex w-full max-w-6xl flex-col gap-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          fullWidth
          isRequired
          name="displayName"
          value={displayName}
          onChange={setDisplayName}
        >
          <Label>Name</Label>
          <Input
            className="w-full"
            placeholder="Your name"
            variant="secondary"
          />
        </TextField>

        <TextField
          fullWidth
          isRequired
          name="primaryEmail"
          type="email"
          value={email}
          onChange={setEmail}
        >
          <Label>Email</Label>
          <Input
            className="w-full"
            placeholder="you@company.com"
            variant="secondary"
          />
          <Description>
            {user.primaryEmailVerified ? "Verified" : "Not verified"}
          </Description>
        </TextField>
      </div>

      <TextField
        fullWidth
        isDisabled={!organization}
        name="organizationName"
        value={organizationName}
        onChange={setOrganizationName}
      >
        <Label>Organization name</Label>
        <Input
          className="w-full"
          placeholder="Organization name"
          variant="secondary"
        />
      </TextField>

      <div className="flex items-center gap-3">
        <Button
          isDisabled={!hasChanges || isSaving}
          isPending={isSaving}
          type="submit"
        >
          {({ isPending }) => (
            <>
              {isPending ? (
                <Spinner color="current" size="sm" />
              ) : (
                <Icon icon="solar:diskette-linear" className="size-4" />
              )}
              Save changes
            </>
          )}
        </Button>
        <PasswordModal />
      </div>
    </form>
  );
}
