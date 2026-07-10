"use client";

import { Input, Label, ListBox, Select, Switch, TextArea } from "@heroui/react";
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
  <Switch size="sm" isSelected={value} onChange={onChange}>
    <Switch.Content>
      <Switch.Control>
        <Switch.Thumb />
      </Switch.Control>
      {label}
    </Switch.Content>
  </Switch>
);

export function PlatformSettingsFields({
  accountId,
  platform,
  kind,
  value,
  onChange,
}: Props) {
  const placements = placementOptions(platform, kind);
  const showTitle = ["youtube", "reddit", "pinterest"].includes(platform);
  const showVisibility = ["youtube", "tiktok"].includes(platform);
  const showAltText = kind === "image" && platform !== "tiktok";
  const showComments = ["facebook", "instagram", "tiktok", "youtube"].includes(
    platform,
  );

  return (
    <div className="flex flex-col gap-3 border-t border-border/70 pt-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        Platform settings
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {placements.length > 1 && (
          <Select
            fullWidth
            variant="secondary"
            value={value.placement ?? placements[0].id}
            onChange={(placement) =>
              onChange({ placement: placement as PostPlacement })
            }
          >
            <Label>Placement</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {placements.map((placement) => (
                  <ListBox.Item
                    key={placement.id}
                    id={placement.id}
                    textValue={placement.label}
                  >
                    {placement.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}

        {showVisibility && (
          <Select
            fullWidth
            variant="secondary"
            value={value.visibility ?? "public"}
            onChange={(visibility) =>
              onChange({ visibility: visibility as PostVisibility })
            }
          >
            <Label>Visibility</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {VISIBILITY_OPTIONS.map((visibility) => (
                  <ListBox.Item
                    key={visibility.id}
                    id={visibility.id}
                    textValue={visibility.label}
                  >
                    {visibility.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}

        {showTitle && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`platform-title-${accountId}`}>
              {platform === "reddit"
                ? "Post title"
                : platform === "pinterest"
                  ? "Pin title"
                  : "Video title"}
            </Label>
            <Input
              id={`platform-title-${accountId}`}
              fullWidth
              variant="secondary"
              value={value.title ?? ""}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </div>
        )}

        {platform === "reddit" && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`subreddit-${accountId}`}>Community</Label>
            <Input
              id={`subreddit-${accountId}`}
              fullWidth
              variant="secondary"
              placeholder="r/community"
              value={value.subreddit ?? ""}
              onChange={(event) => onChange({ subreddit: event.target.value })}
            />
          </div>
        )}

        {platform === "pinterest" && (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`board-${accountId}`}>Board ID</Label>
              <Input
                id={`board-${accountId}`}
                fullWidth
                variant="secondary"
                value={value.boardId ?? ""}
                onChange={(event) => onChange({ boardId: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`destination-${accountId}`}>
                Destination URL
              </Label>
              <Input
                id={`destination-${accountId}`}
                type="url"
                fullWidth
                variant="secondary"
                value={value.destinationUrl ?? ""}
                onChange={(event) =>
                  onChange({ destinationUrl: event.target.value })
                }
              />
            </div>
          </>
        )}

        {showAltText && (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor={`alt-text-${accountId}`}>Alt text</Label>
            <TextArea
              id={`alt-text-${accountId}`}
              fullWidth
              variant="secondary"
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
