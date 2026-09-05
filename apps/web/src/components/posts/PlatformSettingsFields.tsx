"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  placementOptions,
  type PlatformSettings,
  type PostKind,
  type PostPlacement,
  type PostVisibility,
} from "./post-composer-config";

const VISIBILITY_OPTIONS = [
  { id: "public", label: "Public" },
  { id: "followers", label: "Followers" },
  { id: "unlisted", label: "Unlisted" },
  { id: "private", label: "Private" },
] as const;

type Props = {
  accountId: string;
  platform: string;
  kind: PostKind;
  value: PlatformSettings;
  onChange: (patch: Partial<PlatformSettings>) => void;
};

const Toggle = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <label className="flex cursor-pointer items-center gap-2 text-sm">
    <Switch size="sm" checked={value} onCheckedChange={onChange} />
    {label}
  </label>
);

export function PlatformSettingsFields({
  accountId,
  platform,
  kind,
  value,
  onChange,
}: Props) {
  const placements = placementOptions(platform, kind);
  const showTitle = platform === "youtube";
  const showVisibility = ["youtube", "tiktok"].includes(platform);
  const showAltText = kind === "image" && platform !== "tiktok";
  const showComments = platform === "tiktok";

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Platform settings
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {placements.length > 1 && (
          <Select
            items={placements.map((placement) => ({
              value: placement.id,
              label: placement.label,
            }))}
            value={value.placement ?? placements[0].id}
            onValueChange={(placement) =>
              onChange({ placement: placement as PostPlacement })
            }
          >
            <div className="flex w-full flex-col gap-1.5">
              <Label htmlFor={`placement-${accountId}`}>Placement</Label>
              <SelectTrigger id={`placement-${accountId}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {placements.map((placement) => (
                    <SelectItem key={placement.id} value={placement.id}>
                      {placement.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </div>
          </Select>
        )}

        {showVisibility && (
          <Select
            items={VISIBILITY_OPTIONS.map((visibility) => ({
              value: visibility.id,
              label: visibility.label,
            }))}
            value={value.visibility ?? "public"}
            onValueChange={(visibility) =>
              onChange({ visibility: visibility as PostVisibility })
            }
          >
            <div className="flex w-full flex-col gap-1.5">
              <Label htmlFor={`visibility-${accountId}`}>Visibility</Label>
              <SelectTrigger id={`visibility-${accountId}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {VISIBILITY_OPTIONS.map((visibility) => (
                    <SelectItem key={visibility.id} value={visibility.id}>
                      {visibility.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </div>
          </Select>
        )}

        {showTitle && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`platform-title-${accountId}`}>Video title</Label>
            <Input
              id={`platform-title-${accountId}`}
              value={value.title ?? ""}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </div>
        )}

        {showAltText && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`alt-text-${accountId}`}>Alt text</Label>
            <Textarea
              id={`alt-text-${accountId}`}
              rows={2}
              placeholder="Describe the image for accessibility"
              value={value.altText ?? ""}
              onChange={(event) => onChange({ altText: event.target.value })}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-3">
        {value.placement === "reel" && (
          <Toggle
            label="Share to feed"
            value={value.shareToFeed ?? true}
            onChange={(shareToFeed) => onChange({ shareToFeed })}
          />
        )}
        {showComments && (
          <Toggle
            label="Allow comments"
            value={value.allowComments ?? true}
            onChange={(allowComments) => onChange({ allowComments })}
          />
        )}
        {platform === "tiktok" && kind === "video" && (
          <>
            <Toggle
              label="Allow Duet"
              value={value.allowDuet ?? true}
              onChange={(allowDuet) => onChange({ allowDuet })}
            />
            <Toggle
              label="Allow Stitch"
              value={value.allowStitch ?? true}
              onChange={(allowStitch) => onChange({ allowStitch })}
            />
          </>
        )}
        {platform === "youtube" && kind === "video" && (
          <>
            <Toggle
              label="Notify subscribers"
              value={value.notifySubscribers ?? true}
              onChange={(notifySubscribers) => onChange({ notifySubscribers })}
            />
            <Toggle
              label="Made for kids"
              value={value.madeForKids ?? false}
              onChange={(madeForKids) => onChange({ madeForKids })}
            />
          </>
        )}
      </div>
    </div>
  );
}
