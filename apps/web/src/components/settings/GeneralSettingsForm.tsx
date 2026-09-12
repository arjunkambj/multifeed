"use client";

import { Check } from "@honeyicons/react";
import { useState } from "react";
import { toast } from "sonner";
import { PasswordModal } from "@/components/settings/PasswordModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
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
    if (isSaving || !organization || !hasChanges || !organizationName.trim())
      return;
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
      <FieldGroup>
        <Field data-disabled={!organization}>
          <FieldLabel htmlFor="organizationName">Organization name</FieldLabel>
          <Input
            id="organizationName"
            name="organizationName"
            required
            disabled={!organization}
            placeholder="Organization name"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
          />
        </Field>
      </FieldGroup>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={
            !organization || !organizationName.trim() || !hasChanges || isSaving
          }
          type="submit"
        >
          {isSaving ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Check data-icon="inline-start" />
          )}
          Save changes
        </Button>
        <PasswordModal />
      </div>
    </form>
  );
}
