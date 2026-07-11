"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PLATFORM_META } from "@/lib/platform-meta";
import {
  POST_FORMATS,
  POST_KIND_PLATFORMS,
  type PostKind,
} from "./post-composer-config";

export function PostFormatPicker({
  onChange,
}: {
  onChange: (kind: PostKind) => void;
}) {
  return (
    <section className="w-full" aria-label="Choose post format">
      <div className="grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {POST_FORMATS.map((format) => {
          const platforms = POST_KIND_PLATFORMS[format.id];

          return (
            <Button
              key={format.id}
              fullWidth
              variant="tertiary"
              aria-label={`${format.label}. ${format.description}`}
              onPress={() => onChange(format.id)}
              className="group h-auto min-h-48 w-full flex-col items-center justify-center gap-4 rounded-2xl border border-border/70 bg-transparent px-5 py-6 text-center hover:border-accent/40 hover:bg-accent/5"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-surface-secondary text-muted transition-colors group-hover:bg-accent/10 group-hover:text-accent">
                <Icon icon={format.icon} width={24} />
              </span>

              <span className="flex w-full flex-col items-center gap-1">
                <span className="text-base font-semibold text-foreground">
                  {format.label}
                </span>
                <span className="text-sm font-normal text-muted">
                  {format.description}
                </span>
              </span>

              <span className="flex flex-wrap items-center justify-center gap-1.5">
                {platforms.map((platform) => {
                  const meta = PLATFORM_META[platform];
                  return (
                    <span
                      key={platform}
                      title={meta?.label ?? platform}
                      className="flex size-7 items-center justify-center rounded-lg bg-surface-secondary"
                    >
                      <Icon
                        icon={meta?.icon ?? "hugeicons:link-01"}
                        width={14}
                        style={{ color: meta?.brand }}
                        aria-label={meta?.label ?? platform}
                      />
                    </span>
                  );
                })}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
