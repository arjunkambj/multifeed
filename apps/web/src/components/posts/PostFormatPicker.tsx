"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { PLATFORM_META } from "@/lib/platform-meta";
import { POST_FORMATS, type PostKind } from "./post-composer-config";

const FORMAT_PLATFORMS: Record<PostKind, string[]> = {
  text: ["facebook", "linkedin", "threads", "x", "reddit"],
  image: [
    "facebook",
    "instagram",
    "linkedin",
    "threads",
    "x",
    "pinterest",
    "tiktok",
  ],
  video: [
    "facebook",
    "instagram",
    "tiktok",
    "youtube",
    "snapchat",
    "linkedin",
    "x",
  ],
  story: ["facebook", "instagram", "snapchat"],
};

type Props = {
  value?: PostKind | null;
  onChange: (kind: PostKind) => void;
};

export function PostFormatPicker({ value, onChange }: Props) {
  return (
    <section className="w-full">
      <div className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-4">
        {POST_FORMATS.map((format) => {
          const isSelected = value === format.id;
          return (
            <Button
              key={format.id}
              fullWidth
              variant="tertiary"
              aria-pressed={isSelected}
              onPress={() => onChange(format.id)}
              className={
                isSelected
                  ? "group relative h-auto min-h-60 w-full flex-col items-center justify-center gap-5 rounded-3xl border border-accent bg-accent/5 px-6 py-7 text-center"
                  : "group relative h-auto min-h-60 w-full flex-col items-center justify-center gap-5 rounded-3xl border border-dashed border-border bg-transparent px-6 py-7 text-center hover:border-accent/50 hover:bg-accent/5"
              }
            >
              {isSelected && (
                <span className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Icon icon="hugeicons:tick-02" width={13} />
                </span>
              )}
              <span
                className={
                  isSelected
                    ? "flex size-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground"
                    : "flex size-16 items-center justify-center rounded-2xl bg-surface-secondary text-muted transition-colors group-hover:bg-accent/10 group-hover:text-accent"
                }
              >
                <Icon icon={format.icon} width={30} />
              </span>
              <div className="flex w-full flex-col items-center">
                <p className="text-base font-semibold">{format.label}</p>
                <p className="mt-1 text-sm font-normal text-muted">
                  {format.description}
                </p>
                <div className="mt-5 flex min-h-5 flex-wrap items-center justify-center gap-2">
                  {FORMAT_PLATFORMS[format.id].map((platform) => (
                    <Icon
                      key={platform}
                      icon={
                        PLATFORM_META[platform]?.icon ?? "hugeicons:link-01"
                      }
                      width={16}
                      style={{
                        color:
                          platform === "snapchat"
                            ? "#111111"
                            : PLATFORM_META[platform]?.brand,
                      }}
                      aria-label={PLATFORM_META[platform]?.label ?? platform}
                    />
                  ))}
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </section>
  );
}
