"use client";

import { useState } from "react";
import { useUser } from "@hexclave/next";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useRouter } from "next/navigation";

export function CreateOrganizationForm() {
  const router = useRouter();
  const user = useUser({ or: "redirect" });
  const [organizationName, setOrganizationName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const createOrganization = async () => {
    const displayName = organizationName.trim();

    if (!displayName) {
      toast.error("Enter an organization name.");
      return;
    }

    setIsCreating(true);

    try {
      const organization = await user.createTeam({ displayName });
      await user.setSelectedTeam(organization);
      router.replace("/overview");
      router.refresh();
    } catch {
      toast.error("Could not create your organization. Please try again.");
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon icon="solar:buildings-2-linear" width={24} />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
          Create your organization
        </h1>
        <p className="mt-2 text-sm font-light text-muted-foreground">
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="organizationName">Organization name</Label>
          <Input
            id="organizationName"
            name="organizationName"
            autoComplete="organization"
            autoFocus
            required
            disabled={isCreating}
            placeholder="Acme Studio"
            value={organizationName}
            onChange={(event) => setOrganizationName(event.target.value)}
          />
        </div>
        <Button
          className="font-normal"
          disabled={isCreating}
          size="lg"
          type="submit"
        >
          {isCreating ? <Spinner className="size-4" /> : null}
          {isCreating ? "Creating..." : "Create organization"}
        </Button>
      </form>
    </div>
  );
}
