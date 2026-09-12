import type { Doc, Id } from "@convex/_generated/dataModel";
import { AlertTriangle, Integration, Trash } from "@honeyicons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { accountNeedsReconnect } from "@/lib/oauth/required-scopes";
import {
  type OAuthPlatform,
  PLATFORM_META,
  type PlatformMeta,
} from "@/lib/platform-meta";

type ConnectionAccount = Pick<
  Doc<"connectedAccounts">,
  | "_id"
  | "username"
  | "displayName"
  | "avatarUrl"
  | "platform"
  | "status"
  | "scopes"
>;

type PlatformConnectionCardProps = {
  platform: OAuthPlatform;
  accounts: ConnectionAccount[];
  atLimit: boolean;
  connecting: OAuthPlatform | null;
  disconnecting: string | null;
  onConnect: (platform: OAuthPlatform) => void;
  onDisconnect: (account: {
    id: Id<"connectedAccounts">;
    username: string;
  }) => void;
};

export function PlatformConnectionCard({
  platform,
  accounts,
  atLimit,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
}: PlatformConnectionCardProps) {
  const meta: PlatformMeta = PLATFORM_META[platform] ?? {
    label: platform,
    icon: Integration,
    brand: "var(--primary)",
  };
  const isConnecting = connecting === platform;

  return (
    <Card
      size="sm"
      className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 rounded-xl px-3 py-2.5"
    >
      <CardHeader className="contents">
        <div className="contents">
          <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:min-w-32">
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: meta.brand,
                color: meta.foreground ?? "#FFFFFF",
              }}
            >
              <meta.icon size={18} />
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle className="text-sm">
                <h2>{meta.label}</h2>
              </CardTitle>
            </div>
          </div>
          <Button
            className="col-start-3 row-start-1"
            variant={accounts.length > 0 ? "secondary" : "default"}
            disabled={atLimit || connecting !== null}
            aria-label={`${accounts.length > 0 ? "Add another" : "Connect"} ${meta.label} account`}
            onClick={() => onConnect(platform)}
          >
            {isConnecting ? (
              <>
                <Spinner data-icon="inline-start" />
                Connecting…
              </>
            ) : accounts.length > 0 ? (
              "Add account"
            ) : (
              "Connect"
            )}
          </Button>
        </div>
      </CardHeader>
      {accounts.length > 0 && (
        <CardContent className="col-span-3 row-start-2 min-w-0 px-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
          <ul
            className="flex flex-wrap items-center gap-3"
            aria-label={`${meta.label} accounts`}
          >
            {accounts.map((account) => {
              const needsReconnect = accountNeedsReconnect(account);
              return (
                <li key={account._id} className="shrink-0">
                  <Popover>
                    <PopoverTrigger
                      className="relative flex size-8 cursor-pointer rounded-full outline-none transition-shadow hover:ring-1 hover:ring-foreground/10 focus-visible:ring-1 focus-visible:ring-ring/50 data-popup-open:ring-1 data-popup-open:ring-ring/50"
                      aria-label={`Manage @${account.username} on ${meta.label}${needsReconnect ? ", reconnect needed" : ""}`}
                      title={`@${account.username}${needsReconnect ? " · Reconnect needed" : ""}`}
                    >
                      <Avatar className="size-8">
                        {account.avatarUrl && (
                          <AvatarImage src={account.avatarUrl} alt="" />
                        )}
                        <AvatarFallback>
                          {account.username.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className="absolute -right-0.5 -bottom-0.5 flex size-4 items-center justify-center rounded-full ring-2 ring-card"
                        style={{
                          backgroundColor: meta.brand,
                          color: meta.foreground ?? "#FFFFFF",
                        }}
                        aria-hidden
                      >
                        <meta.icon size={12} />
                      </span>
                      {needsReconnect && (
                        <span
                          className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground ring-2 ring-card"
                          aria-hidden
                        >
                          <AlertTriangle size={12} />
                        </span>
                      )}
                    </PopoverTrigger>
                    <PopoverContent
                      align="start"
                      sideOffset={10}
                      className="max-w-[calc(100vw-2rem)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <PopoverHeader className="min-w-0">
                          <PopoverTitle className="break-words">
                            {account.displayName || `@${account.username}`}
                          </PopoverTitle>
                          <PopoverDescription className="break-words">
                            @{account.username}
                          </PopoverDescription>
                        </PopoverHeader>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Disconnect @${account.username} from ${meta.label}`}
                          disabled={disconnecting !== null}
                          onClick={() =>
                            onDisconnect({
                              id: account._id,
                              username: account.username,
                            })
                          }
                        >
                          {disconnecting === account._id ? (
                            <Spinner />
                          ) : (
                            <Trash />
                          )}
                        </Button>
                      </div>
                      {needsReconnect && (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="destructive">Reconnect needed</Badge>
                          <Button
                            disabled={connecting !== null}
                            onClick={() => onConnect(platform)}
                            aria-label={`Reconnect @${account.username} on ${meta.label}`}
                          >
                            {isConnecting && (
                              <Spinner data-icon="inline-start" />
                            )}
                            Reconnect
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </li>
              );
            })}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
