"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Chip, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import {
  CONNECTABLE_PLATFORMS,
  PLATFORM_META,
} from "@/components/connections/platform-meta";
import type { OAuthPlatform } from "@/components/connections/types";
import { OAUTH_ERROR_MESSAGES, oauthErrorMessage } from "@/lib/oauth/env";

const statusTone: Record<string, "success" | "warning" | "danger" | "default"> =
  {
    active: "success",
    expired: "warning",
    revoked: "danger",
    error: "danger",
    pending_selection: "warning",
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <DashboardPageTitle title="Connections" />
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Connect multiple accounts per network — Instagram, TikTok, Snapchat,
            and more. Tokens are stored encrypted for publishing.
          </p>
        </div>
        {accounts && (
          <p className="text-sm text-muted">
            <span className="font-medium text-foreground">
              {accounts.length}
            </span>{" "}
            connected
          </p>
        )}
      </div>

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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              <Card
                key={platform}
                className="border border-border bg-surface shadow-none"
              >
                <Card.Header className="flex flex-row items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex size-10 items-center justify-center rounded-xl text-white"
                      style={{
                        backgroundColor: meta.brand,
                        color: meta.foreground ?? "#FFFFFF",
                      }}
                    >
                      <Icon icon={meta.icon} width={20} />
                    </span>
                    <div>
                      <Card.Title className="text-base">
                        {meta.label}
                      </Card.Title>
                      <Card.Description className="text-xs">
                        {meta.description}
                      </Card.Description>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    isPending={isConnecting}
                    onPress={() => void onConnect(platform)}
                  >
                    {isConnecting ? "Redirecting…" : "Connect"}
                  </Button>
                </Card.Header>
                <Card.Content className="flex flex-col gap-2 pt-0">
                  {connected.length === 0 ? (
                    <p className="rounded-xl bg-default/40 px-3 py-4 text-center text-xs text-muted">
                      No accounts connected yet
                    </p>
                  ) : (
                    connected.map((account) => (
                      <div
                        key={account._id}
                        className="flex items-center gap-3 rounded-xl border border-border/60 px-3 py-2"
                      >
                        {account.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={account.avatarUrl}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-8 items-center justify-center rounded-full bg-default text-xs font-medium">
                            {account.username.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {account.displayName ?? account.username}
                          </p>
                          <p className="truncate text-xs text-muted">
                            @{account.username}
                          </p>
                        </div>
                        <Chip
                          size="sm"
                          color={statusTone[account.status] ?? "default"}
                          variant="soft"
                        >
                          {account.status}
                        </Chip>
                        <Button
                          size="sm"
                          variant="tertiary"
                          isPending={disconnecting === account._id}
                          onPress={() =>
                            void onDisconnect(
                              account._id as Id<"connectedAccounts">,
                            )
                          }
                        >
                          <Icon icon="hugeicons:delete-02" width={16} />
                        </Button>
                      </div>
                    ))
                  )}
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
