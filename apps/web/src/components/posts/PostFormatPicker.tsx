"use client";

import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { accountNeedsReconnect } from "@/lib/oauth/required-scopes";
import { PLATFORM_META, platformLabel } from "@/lib/platform-meta";
import {
  POST_FORMATS,
  accountSupportsPostKind,
  POST_KIND_PLATFORMS,
  type PostKind,
} from "./post-composer-config";

export function PostFormatPicker({
  accounts,
  onChange,
}: {
  accounts?: {
    platform: string;
    status: string;
    scopes: string[];
    capabilities: string[];
  }[];
  onChange: (kind: PostKind) => void;
}) {
  return (
    <section className="w-full" aria-label="Choose post format">
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {POST_FORMATS.map((format) => {
          const platforms = POST_KIND_PLATFORMS[format.id];
          const platformNames = platforms.map(platformLabel).join(", ");
          const compatibleCount = accounts?.filter(
            (account) =>
              !accountNeedsReconnect(account) &&
              accountSupportsPostKind(account, format.id),
          ).length;

          return (
            <button
              key={format.id}
              type="button"
              aria-label={`${format.label}. ${format.description}. Supported on ${platformNames}`}
              aria-describedby={`format-accounts-${format.id}`}
              onClick={() => onChange(format.id)}
              className="group flex h-full min-h-52 w-full flex-col items-center rounded-2xl bg-muted px-5 py-5 text-center outline-none transition-colors hover:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_4%)] focus-visible:ring-3 focus-visible:ring-ring/30"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-background text-muted-foreground transition-colors group-hover:text-primary">
                <Icon icon={format.icon} width={22} />
              </span>

              <span className="mt-4 flex w-full flex-col items-center gap-1">
                <span className="text-sm font-semibold text-foreground">
                  {format.label}
                </span>
                <span className="text-sm font-normal leading-snug text-muted-foreground">
                  {format.description}
                </span>
              </span>

              <span className="mt-auto flex flex-wrap items-center justify-center gap-1.5 pt-5">
                {platforms.map((platform) => {
                  const meta = PLATFORM_META[platform];
                  return (
                    <span
                      key={platform}
                      title={meta?.label ?? platform}
                      className="flex size-7 items-center justify-center rounded-full bg-background"
                    >
                      <Icon
                        icon={meta?.icon ?? "hugeicons:link-01"}
                        width={13}
                        style={{ color: meta?.brand }}
                        aria-hidden
                      />
                    </span>
                  );
                })}
              </span>
              <span id={`format-accounts-${format.id}`} className="mt-3">
                <Badge variant="secondary">
                  {compatibleCount === undefined
                    ? "Checking accounts…"
                    : compatibleCount === 0
                      ? "Connect an account to publish"
                      : `${compatibleCount} ${compatibleCount === 1 ? "account" : "accounts"} available`}
                </Badge>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
