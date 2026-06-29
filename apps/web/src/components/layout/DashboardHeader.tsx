"use client";

import { Icon } from "@iconify/react";
import { UserProfileMenu } from "@/components/layout/UserProfileMenu";

type DashboardUser = {
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
};

export function DashboardHeader({
  onToggle,
  user,
}: {
  onToggle: () => void;
  user: DashboardUser;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <button
        type="button"
        onClick={onToggle}
        className="inline-flex size-9 items-center rounded-3xl justify-center text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
        aria-label="Toggle sidebar"
      >
        <Icon icon="hugeicons:sidebar-left" className="size-4.5" />
      </button>
      <div className="ml-auto flex items-center justify-end">
        <UserProfileMenu user={user} />
      </div>
    </header>
  );
}
