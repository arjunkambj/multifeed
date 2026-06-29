"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Description,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useUser } from "@hexclave/next";
import { PasswordPopover } from "@/components/settings/PasswordPopover";

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
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

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
    setError("");
    setStatus("saving");

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
      setStatus("saved");
    } catch (err) {
      setStatus("idle");
      setError(String(err));
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
          variant="secondary"
          value={displayName}
          onChange={setDisplayName}
        >
          <Label>Name</Label>
          <Input className="w-full" placeholder="Your name" />
        </TextField>

        <TextField
          fullWidth
          isRequired
          name="primaryEmail"
          type="email"
          variant="secondary"
          value={email}
          onChange={setEmail}
        >
          <Label>Email</Label>
          <Input className="w-full" placeholder="you@company.com" />
          <Description>
            {user.primaryEmailVerified ? "Verified" : "Not verified"}
          </Description>
        </TextField>
      </div>

      <TextField
        fullWidth
        isDisabled={!organization}
        name="organizationName"
        variant="secondary"
        value={organizationName}
        onChange={setOrganizationName}
      >
        <Label>Organization name</Label>
        <Input className="w-full" placeholder="Organization name" />
      </TextField>

      {error && (
        <FieldError className="rounded-2xl border border-danger/20 bg-danger/10 px-3 py-2 text-sm">
          {error}
        </FieldError>
      )}

      <div className="flex items-center gap-3">
        <Button
          isDisabled={!hasChanges || status === "saving"}
          isPending={status === "saving"}
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
        <PasswordPopover />
        {status === "saved" && (
          <span className="text-sm font-medium text-success">Saved</span>
        )}
      </div>
    </form>
  );
}
