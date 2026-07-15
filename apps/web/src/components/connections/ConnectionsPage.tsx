"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Modal, Spinner, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { RemoteAvatar } from "@/components/RemoteAvatar";
import {
  CONNECTABLE_PLATFORMS,
  PLATFORM_META,
  type OAuthPlatform,
} from "@/lib/platform-meta";
import { oauthErrorMessage } from "@/lib/oauth/env";

const statusDot: Record<Doc<"connectedAccounts">["status"], string> = {
  active: "bg-success",
  expired: "bg-warning",
  revoked: "bg-danger",
  error: "bg-danger",
};

export function ConnectionsPage() {
  const accounts = useQuery(api.oauth.accounts.list, {});
  const disconnect = useMutation(api.oauth.accounts.disconnect);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [connecting, setConnecting] = useState<OAuthPlatform | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [accountToDisconnect, setAccountToDisconnect] = useState<{
    id: Id<"connectedAccounts">;
    username: string;
  } | null>(null);
  const handledFlash = useRef("");
  const connected = searchParams.get("connected") ?? "";
  const oauthError = searchParams.get("error") ?? "";
  const flashKey = `${connected}\0${oauthError}`;

  useEffect(() => {
    if (flashKey === "\0") return;

    if (handledFlash.current !== flashKey) {
      handledFlash.current = flashKey;
      if (connected) {
        const label = PLATFORM_META[connected]?.label ?? "Account";
        toast.success(`${label} connected successfully.`, { timeout: 3000 });
      } else if (oauthError) {
        toast.danger(oauthErrorMessage(oauthError), { timeout: 3000 });
      }
    }

    router.replace("/connections", { scroll: false });
  }, [connected, flashKey, oauthError, router]);

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

  const onConnect = async (platform: OAuthPlatform) => {
    setConnecting(platform);
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
      toast.danger(
        err instanceof Error ? err.message : "Could not start OAuth",
        { timeout: 3000 },
      );
    }
  };

  const onDisconnect = async (accountId: Id<"connectedAccounts">) => {
    setDisconnecting(accountId);
    try {
      await disconnect({ accountId });
      setAccountToDisconnect(null);
      toast.success("Account disconnected.", { timeout: 3000 });
    } catch (err) {
      toast.danger(
        err instanceof Error ? err.message : "Could not disconnect account",
        { timeout: 3000 },
      );
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <DashboardPageTitle
          title="Connections"
          description="Connect and manage social accounts from one workspace. Tokens are encrypted for publishing."
        />

        {accounts === undefined ? (
          <div
            className="flex min-h-52 flex-col items-center justify-center gap-3"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Spinner color="accent" size="lg" />
            <p className="text-sm text-muted">Loading connections…</p>
          </div>
        ) : (
          <section className="divide-y divide-border/70">
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
                      variant="primary"
                      className="justify-start"
                      isDisabled={connecting !== null && !isConnecting}
                      isPending={isConnecting}
                      onPress={() => void onConnect(platform)}
                    >
                      {isConnecting ? (
                        <>
                          <Spinner color="current" size="sm" />
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
                      <p className="text-xs text-muted">
                        No {meta.label} accounts connected
                      </p>
                    ) : (
                      linked.map((account) => {
                        const needsAttention = account.status !== "active";
                        return (
                          <div
                            key={account._id}
                            className={[
                              "flex max-w-full items-center gap-2 rounded-full bg-surface-secondary py-1 pl-1.5 pr-1",
                              needsAttention ? "ring-1 ring-warning/50" : "",
                            ].join(" ")}
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
                              className={`size-1.5 shrink-0 rounded-full ${statusDot[account.status] ?? "bg-muted"}`}
                              title={account.status}
                            />
                            <p className="max-w-40 truncate text-xs font-medium">
                              @{account.username}
                            </p>
                            {needsAttention && (
                              <Button
                                size="sm"
                                variant="tertiary"
                                className="h-6 min-h-6 px-1.5 text-[11px] text-warning"
                                isDisabled={
                                  connecting !== null && !isConnecting
                                }
                                isPending={isConnecting}
                                onPress={() => void onConnect(platform)}
                              >
                                Reconnect
                              </Button>
                            )}
                            <Button
                              isIconOnly
                              size="sm"
                              variant="tertiary"
                              aria-label={`Disconnect @${account.username}`}
                              className="size-6 min-w-6 rounded-full text-muted hover:text-danger"
                              isPending={disconnecting === account._id}
                              onPress={() =>
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
        )}
      </div>

      <Modal
        isOpen={accountToDisconnect !== null}
        onOpenChange={(open) => {
          if (!open && disconnecting === null) setAccountToDisconnect(null);
        }}
      >
        <Modal.Backdrop
          variant="blur"
          isDismissable={disconnecting === null}
          isKeyboardDismissDisabled={disconnecting !== null}
        >
          <Modal.Container placement="center" size="sm">
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Disconnect account?</Modal.Heading>
                <p className="text-sm leading-relaxed text-muted">
                  Disconnect @{accountToDisconnect?.username}? You can reconnect
                  it anytime.
                </p>
              </Modal.Header>
              <Modal.Footer>
                <Button
                  type="button"
                  variant="tertiary"
                  isDisabled={disconnecting !== null}
                  onPress={() => setAccountToDisconnect(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  isPending={disconnecting !== null}
                  onPress={() => {
                    if (accountToDisconnect) {
                      void onDisconnect(accountToDisconnect.id);
                    }
                  }}
                >
                  Disconnect
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
