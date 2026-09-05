"use client";

import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ConnectionUsageMeter } from "@/components/connections/ConnectionUsageMeter";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { RemoteAvatar } from "@/components/RemoteAvatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { oauthErrorMessage } from "@/lib/oauth/env";
import { accountNeedsReconnect } from "@/lib/oauth/required-scopes";
import {
  CONNECTABLE_PLATFORMS,
  type OAuthPlatform,
  PLATFORM_META,
} from "@/lib/platform-meta";
import { currentTimeBucket } from "@/lib/time-bucket";

const statusDot: Record<Doc<"connectedAccounts">["status"], string> = {
  active: "bg-emerald-500",
  expired: "bg-amber-500",
  revoked: "bg-red-500",
  error: "bg-red-500",
};

function ConnectionsPageInner() {
  const [nowMs] = useState(() => currentTimeBucket());
  const pageData = useQuery(api.oauth.accounts.getConnectionsPageData, {
    nowMs,
  });
  const disconnect = useMutation(api.oauth.accounts.disconnect);
  const searchParams = useSearchParams();

  const [connecting, setConnecting] = useState<OAuthPlatform | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [accountToDisconnect, setAccountToDisconnect] = useState<{
    id: Id<"connectedAccounts">;
    username: string;
  } | null>(null);
  const handledFlash = useRef("");
  const connected = searchParams.get("connected") ?? "";
  const oauthError = searchParams.get("error") ?? "";
  const skipped = searchParams.get("skipped") ?? "";
  const flashKey = `${connected}\0${oauthError}\0${skipped}`;
  const accounts = pageData?.accounts;
  const entitlements = pageData?.entitlements;
  const connectedAccountsCount = (accounts ?? []).filter(
    (account) => account.status !== "revoked",
  ).length;

  useEffect(() => {
    if (!connected && !oauthError && !skipped) return;

    if (handledFlash.current !== flashKey) {
      handledFlash.current = flashKey;
      if (connected) {
        const label = PLATFORM_META[connected]?.label ?? "Account";
        const skippedCount = Number.parseInt(skipped, 10);
        if (Number.isFinite(skippedCount) && skippedCount > 0) {
          toast.warning(
            `${label} connected. ${skippedCount} more account${
              skippedCount === 1 ? " was" : "s were"
            } skipped because your plan limit was reached. Upgrade to connect them.`,
          );
        } else {
          toast.success(`${label} connected successfully.`);
        }
      } else if (oauthError) {
        toast.error(oauthErrorMessage(oauthError));
      }
    }

    window.history.replaceState(null, "", "/connections");
  }, [connected, flashKey, oauthError, skipped]);

  if (!accounts || !entitlements) {
    return <DashboardLoadingSkeleton variant="connections" />;
  }

  const accountLimit = entitlements.connectedAccountLimit;
  const atLimit = connectedAccountsCount >= accountLimit;

  const byPlatform = new Map<string, typeof accounts>();
  for (const platform of CONNECTABLE_PLATFORMS) {
    byPlatform.set(platform, []);
  }
  for (const account of accounts) {
    const list = byPlatform.get(account.platform) ?? [];
    list.push(account);
    byPlatform.set(account.platform, list);
  }

  const onConnect = (platform: OAuthPlatform) => {
    setConnecting(platform);
    void fetch("/api/oauth/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, returnTo: "/connections" }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not start OAuth");
        const payload = (await response.json()) as {
          url?: string;
          error?: string;
        };
        if (!payload.url) {
          throw new Error(payload.error ?? "Could not start OAuth");
        }
        window.location.assign(payload.url);
      })
      .catch((err) => {
        setConnecting(null);
        toast.error(
          err instanceof Error ? err.message : "Could not start OAuth",
        );
      });
  };

  const onDisconnect = (accountId: Id<"connectedAccounts">) => {
    setDisconnecting(accountId);
    void disconnect({ accountId })
      .then(() => {
        setAccountToDisconnect(null);
        toast.success("Account disconnected.");
      })
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Could not disconnect account",
        );
      })
      .finally(() => setDisconnecting(null));
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <DashboardPageTitle
          title="Connections"
          description="Connect social accounts from one workspace."
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <ConnectionUsageMeter
            used={connectedAccountsCount}
            limit={accountLimit}
          />
          <section className="min-w-0 flex-1 divide-y divide-border/70 lg:order-first">
            {CONNECTABLE_PLATFORMS.map((platform) => {
              const meta = PLATFORM_META[platform] ?? {
                label: platform,
                icon: "hugeicons:link-01",
                brand: "#666666",
              };
              const linked = byPlatform.get(platform) ?? [];
              const isConnecting = connecting === platform;
              const hasAccounts = linked.length > 0;

              return (
                <div
                  key={platform}
                  className="grid gap-3 py-3.5 first:pt-0 last:pb-0 md:grid-cols-[220px_minmax(0,1fr)] md:items-center"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-white"
                      style={{
                        backgroundColor: meta.brand,
                        color: meta.foreground ?? "#FFFFFF",
                      }}
                    >
                      <Icon icon={meta.icon} width={16} />
                    </span>
                    <Button
                      size="sm"
                      variant="default"
                      className="justify-start"
                      disabled={
                        atLimit || (connecting !== null && !isConnecting)
                      }
                      title={
                        atLimit
                          ? "Plan limit reached. Upgrade to connect more accounts."
                          : undefined
                      }
                      onClick={() => void onConnect(platform)}
                    >
                      {isConnecting ? (
                        <>
                          <Spinner className="size-3" />
                          Redirecting…
                        </>
                      ) : hasAccounts ? (
                        `Add ${meta.label}`
                      ) : (
                        `Connect ${meta.label}`
                      )}
                    </Button>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {linked.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No {meta.label} accounts connected
                      </p>
                    ) : (
                      linked.map((account) => {
                        const needsAttention = accountNeedsReconnect(account);
                        return (
                          <div
                            key={account._id}
                            className={[
                              "flex max-w-full items-center gap-2 rounded-full bg-muted py-1 pl-1.5 pr-1",
                              needsAttention ? "ring-1 ring-amber-500/50" : "",
                            ].join(" ")}
                          >
                            {account.avatarUrl ? (
                              <RemoteAvatar
                                src={account.avatarUrl}
                                size={24}
                                className="size-6 rounded-full object-cover"
                              />
                            ) : (
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-semibold">
                                {account.username.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                            <span
                              className={`size-1.5 shrink-0 rounded-full ${statusDot[account.status] ?? "bg-muted"}`}
                              title={account.status}
                            />
                            <p className="max-w-40 truncate text-xs font-medium">
                              @{account.username}
                            </p>
                            {needsAttention && (
                              <Button
                                size="xs"
                                variant="ghost"
                                className="h-6 min-h-6 px-1.5 text-[11px] text-amber-500"
                                disabled={connecting !== null && !isConnecting}
                                onClick={() => void onConnect(platform)}
                              >
                                Reconnect
                              </Button>
                            )}
                            <Button
                              size="icon-xs"
                              variant="ghost"
                              aria-label={`Disconnect @${account.username}`}
                              className="size-6 min-w-6 rounded-full text-muted-foreground hover:text-red-600"
                              disabled={disconnecting === account._id}
                              onClick={() =>
                                setAccountToDisconnect({
                                  id: account._id,
                                  username: account.username,
                                })
                              }
                            >
                              <Icon icon="hugeicons:delete-02" width={13} />
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </div>
      </div>

      <Dialog
        open={accountToDisconnect !== null}
        onOpenChange={(open) => {
          if (!open && disconnecting === null) setAccountToDisconnect(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect account?</DialogTitle>
            <DialogDescription>
              Disconnect @{accountToDisconnect?.username}? You can reconnect it
              anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={disconnecting !== null}
              onClick={() => setAccountToDisconnect(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={disconnecting !== null}
              onClick={() => {
                if (accountToDisconnect) {
                  void onDisconnect(accountToDisconnect.id);
                }
              }}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ConnectionsPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="connections" />}>
      <ConnectionsPageInner />
    </Suspense>
  );
}
