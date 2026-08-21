"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
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

  const hasChanges =
    displayName.trim() !== (user.displayName ?? "") ||
    email.trim() !== (user.primaryEmail ?? "") ||
    organizationName.trim() !== (organization?.displayName ?? "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const updates = [
      user.update({
        displayName: cleanOptional(displayName),
        primaryEmail: cleanOptional(email),
      }),
    ];

    if (organization && organizationName.trim() !== organization.displayName) {
      updates.push(
        organization.update({ displayName: organizationName.trim() }),
      );
    }

    void Promise.all(updates)
      .then(() => toast.success("Changes saved."))
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setIsSaving(false));
  };

  return (
    <form
      className="flex w-full max-w-6xl flex-col gap-5"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex w-full flex-col gap-1.5">
          <Label htmlFor="displayName">Name</Label>
          <Input
            id="displayName"
            name="displayName"
            required
            placeholder="Your name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <Label htmlFor="primaryEmail">Email</Label>
          <Input
            id="primaryEmail"
            name="primaryEmail"
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            {user.primaryEmailVerified ? "Verified" : "Not verified"}
          </p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <Label htmlFor="organizationName">Organization name</Label>
        <Input
          id="organizationName"
          name="organizationName"
          disabled={!organization}
          placeholder="Organization name"
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          disabled={!hasChanges || isSaving}
          type="submit"
        >
          {isSaving ? (
            <Spinner className="size-4" />
          ) : (
            <Icon icon="solar:diskette-linear" width={16} />
          )}
          Save changes
        </Button>
        <PasswordModal />
      </div>
    </form>
  );
}
