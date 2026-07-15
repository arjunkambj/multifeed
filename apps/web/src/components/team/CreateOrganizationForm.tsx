"use client";

import { useState } from "react";
import { useUser } from "@hexclave/next";
import { Icon } from "@iconify/react";
import {
  Button,
  Input,
  Label,
  Spinner,
  TextField,
  toast,
} from "@heroui/react";
import { useRouter } from "next/navigation";

export function CreateOrganizationForm() {
  const router = useRouter();
  const user = useUser({ or: "redirect" });
  const [organizationName, setOrganizationName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createOrganization = async () => {
    const displayName = organizationName.trim();

    if (!displayName) {
      toast.danger("Enter an organization name.", { timeout: 3000 });
      return;
    }

    setIsCreating(true);

    try {
      const organization = await user.createTeam({ displayName });
      await user.setSelectedTeam(organization);
      router.replace("/overview");
      router.refresh();
    } catch {
      toast.danger("Could not create your organization. Please try again.", {
        timeout: 3000,
      });
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Icon icon="solar:buildings-2-linear" className="size-6" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Create your organization
        </h1>
        <p className="mt-2 text-sm font-light text-muted">
          Give your workspace a name. You can invite your team after setup.
        </p>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void createOrganization();
        }}
      >
        <TextField
          fullWidth
          isDisabled={isCreating}
          isRequired
          name="organizationName"
          value={organizationName}
          onChange={setOrganizationName}
        >
          <Label>Organization name</Label>
          <Input
            autoComplete="organization"
            autoFocus
            className="w-full"
            placeholder="Acme Studio"
            variant="secondary"
          />
        </TextField>
        <Button
          className="font-normal"
          fullWidth
          isDisabled={isCreating}
          size="lg"
          type="submit"
        >
          {isCreating ? <Spinner size="sm" /> : null}
          {isCreating ? "Creating..." : "Create organization"}
        </Button>
      </form>
    </div>
  );
}
