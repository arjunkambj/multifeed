"use client";

import { useState } from "react";
import { Button, Card, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { PLATFORM_META } from "@/components/connections/platform-meta";
import type { OAuthPlatform } from "@/components/connections/types";

function safeSameOriginPath(next: string): string | null {
  // Prefer relative paths from the API.
  if (next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  try {
    const u = new URL(next, window.location.origin);
    if (u.origin !== window.location.origin) return null;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return null;
  }
}

export function SelectAccountPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const state = searchParams.get("state") ?? "";
  const platformParam = searchParams.get("platform") ?? "";

  const pending = useQuery(
    api.oauth.accounts.getPendingSelection,
    state ? { state } : "skip",
  );

  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const platform = (pending?.platform ?? platformParam) as OAuthPlatform;
  const meta = PLATFORM_META[platform];

  const onSelect = async (optionId: string) => {
    setSelecting(optionId);
    setError("");
    try {
      const response = await fetch("/api/oauth/complete-selection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, optionId }),
      });
      const payload = (await response.json()) as {
        redirectTo?: string;
        platform?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Selection failed");
      }
      const fallback = `/connections?connected=${payload.platform ?? platform}`;
      const next =
        safeSameOriginPath(payload.redirectTo ?? fallback) ?? fallback;
      window.location.assign(next);
    } catch (err) {
      setSelecting(null);
      setError(err instanceof Error ? err.message : "Selection failed");
    }
  };

  if (!state) {
    return (
      <div className="flex flex-col gap-4">
        <DashboardPageTitle title="Select account" />
        <p className="text-sm text-danger">Missing OAuth session state.</p>
      </div>
    );
  }

  if (pending === undefined) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (pending === null) {
    return (
      <div className="flex flex-col gap-4">
        <DashboardPageTitle title="Select account" />
        <p className="text-sm text-muted">
          This selection session expired.{" "}
          <button
            type="button"
            className="text-accent underline"
            onClick={() => router.push("/connections")}
          >
            Back to connections
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <div>
        <DashboardPageTitle title="Choose an account" />
        <p className="mt-1 text-sm text-muted">
          Select which {meta?.label ?? platform} account to connect to this
          workspace.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {(pending.options ?? []).map((option) => (
          <Card
            key={option.id}
            className="border border-border bg-surface shadow-none"
          >
            <Card.Content className="flex flex-row items-center gap-3 py-3">
              {option.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={option.avatarUrl}
                  alt=""
                  className="size-10 rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex size-10 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: meta?.brand ?? "#666" }}
                >
                  <Icon icon={meta?.icon ?? "hugeicons:link-01"} width={18} />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{option.label}</p>
                {option.username && (
                  <p className="truncate text-xs text-muted">
                    @{option.username}
                  </p>
                )}
              </div>
              <Button
                size="sm"
                variant="primary"
                isDisabled={selecting !== null}
                isPending={selecting === option.id}
                onPress={() => void onSelect(option.id)}
              >
                Connect
              </Button>
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  );
}
