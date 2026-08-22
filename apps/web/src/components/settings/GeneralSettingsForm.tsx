"use client";

import { Icon } from "@iconify/react";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordModal } from "@/components/settings/PasswordModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { hexclaveClientApp } from "@/hexclave/client";

export function GeneralSettingsForm() {
  const user = hexclaveClientApp.useUser({ or: "redirect" });
  const organization = user.selectedTeam;
  const [organizationName, setOrganizationName] = useState(
    organization?.displayName ?? "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges =
    organizationName.trim() !== (organization?.displayName ?? "");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || !organization || !hasChanges) return;
    setIsSaving(true);

    void organization
      .update({ displayName: organizationName.trim() })
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
        <Button disabled={!hasChanges || isSaving} type="submit">
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
