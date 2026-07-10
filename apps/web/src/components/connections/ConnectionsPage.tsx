"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { RemoteAvatar } from "@/components/RemoteAvatar";
import {
  CONNECTABLE_PLATFORMS,
  PLATFORM_META,
} from "@/components/connections/platform-meta";
import type { OAuthPlatform } from "@/components/connections/types";
import { OAUTH_ERROR_MESSAGES, oauthErrorMessage } from "@/lib/oauth/env";

const statusDot: Record<string, string> = {
  active: "bg-success",
  expired: "bg-warning",
  revoked: "bg-danger",
  error: "bg-danger",
  pending_selection: "bg-warning",
};

export function ConnectionsPage() {
  const accounts = useQuery(api.oauth.accounts.list, {});
  const disconnect = useMutation(api.oauth.accounts.disconnect);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [connecting, setConnecting] = useState<OAuthPlatform | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Capture OAuth flash once from the URL, then strip params so refresh is clean.
  const flashKey = `${searchParams.get("connected") ?? ""}\0${searchParams.get("error") ?? ""}`;
  const [banner] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const error = params.get("error");
    if (connected) {
      const label =
        PLATFORM_META[connected as OAuthPlatform]?.label ?? connected;
      return {
        type: "success",
        message: `${label} connected successfully.`,
      };
    }
    if (error) {
      const isKnownCode = Object.prototype.hasOwnProperty.call(
        OAUTH_ERROR_MESSAGES,
        error,
      );
      return {
        type: "error",
        message: isKnownCode ? oauthErrorMessage(error) : error.slice(0, 200),
      };
    }
    return null;
  });

  useEffect(() => {
    if (flashKey === "\0") return;
    router.replace("/connections", { scroll: false });
  }, [flashKey, router]);

  const byPlatform = useMemo(() => {
    const map = new Map<string, NonNullable<typeof accounts>>();
    for (const platform of CONNECTABLE_PLATFORMS) {
      map.set(platform, []);
    }
    if (!accounts) return map;
    for (const account of accounts) {
      const list = map.get(account.platform) ?? [];
      list.push(account);
      map.set(account.platform, list);
    }
    return map;
  }, [accounts]);

  const displayBanner =
    actionError != null
      ? { type: "error" as const, message: actionError }
      : banner;

  const onConnect = async (platform: OAuthPlatform) => {
    setConnecting(platform);
    setActionError(null);
    try {
      const response = await fetch("/api/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, returnTo: "/connections" }),
      });
      const payload = (await response.json()) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Could not start OAuth");
      }
      window.location.assign(payload.url);
    } catch (err) {
      setConnecting(null);
      setActionError(
        err instanceof Error ? err.message : "Could not start OAuth",
      );
    }
  };

  const onDisconnect = async (accountId: Id<"connectedAccounts">) => {
    setDisconnecting(accountId);
    try {
      await disconnect({ accountId });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Could not disconnect account",
      );
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageTitle
        title="Connections"
        description="Connect and manage multiple social accounts from one workspace. Tokens are encrypted for publishing."
      />

      {displayBanner && (
        <div
          className={
            displayBanner.type === "success"
              ? "rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success"
              : "rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
          }
        >
          {displayBanner.message}
        </div>
      )}

      {accounts === undefined ? (
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <section>
          <div className="divide-y divide-border/70">
            {CONNECTABLE_PLATFORMS.map((platform) => {
              const meta = PLATFORM_META[platform] ?? {
                label: platform,
                icon: "hugeicons:link-01",
                brand: "#666666",
                description: "",
              };
              const connected = byPlatform.get(platform) ?? [];
              const isConnecting = connecting === platform;

              return (
                <div
                  key={platform}
                  className="grid gap-3 py-3 first:pt-0 last:pb-0 md:grid-cols-[240px_minmax(0,1fr)] md:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex size-9 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{
                        backgroundColor: meta.brand,
                        color: meta.foreground ?? "#FFFFFF",
                      }}
                    >
                      <Icon icon={meta.icon} width={18} />
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      className="justify-start"
                      isPending={isConnecting}
                      onPress={() => void onConnect(platform)}
                    >
                      {isConnecting
                        ? "Redirecting…"
                        : connected.length > 0
                          ? `Add ${meta.label}`
                          : `Connect ${meta.label}`}
                    </Button>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {connected.length === 0 ? (
                      <p className="text-xs text-muted">
                        No {meta.label} accounts connected
                      </p>
                    ) : (
                      connected.map((account) => (
                        <div
                          key={account._id}
                          className="flex max-w-full items-center gap-2 rounded-full border border-border/70 bg-surface-secondary px-2 py-1.5"
                        >
                          {account.avatarUrl ? (
                            <RemoteAvatar
                              src={account.avatarUrl}
                              size={24}
                              className="size-6 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-semibold">
                              {account.username.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span
                            className={`size-2 shrink-0 rounded-full ${statusDot[account.status] ?? "bg-muted"}`}
                            title={account.status}
                          />
                          <div className="min-w-0">
                            <p className="max-w-44 truncate text-xs font-medium">
                              @{account.username}
                            </p>
                          </div>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="tertiary"
                            aria-label={`Disconnect @${account.username}`}
                            className="size-7 min-w-7 rounded-full"
                            isPending={disconnecting === account._id}
                            onPress={() =>
                              void onDisconnect(
                                account._id as Id<"connectedAccounts">,
                              )
                            }
                          >
                            <Icon icon="hugeicons:delete-02" width={14} />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
