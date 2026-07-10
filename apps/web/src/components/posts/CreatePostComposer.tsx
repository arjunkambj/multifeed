"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Calendar,
  Checkbox,
  DateField,
  DatePicker,
  Input,
  Label,
  Spinner,
  Tabs,
  TextArea,
  TimeField,
} from "@heroui/react";
import type { TimeValue } from "@heroui/react";
import type { DateValue } from "@internationalized/date";
import {
  CalendarDate,
  CalendarDateTime,
  fromDate,
  Time,
  toZoned,
} from "@internationalized/date";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { RemoteAvatar } from "@/components/RemoteAvatar";
import {
  PLATFORM_META,
  platformBrand,
  platformLabel,
} from "@/lib/platform-meta";
import { PlatformSettingsFields } from "./PlatformSettingsFields";
import { PostFormatPicker } from "./PostFormatPicker";
import { PostMediaUploader } from "./PostMediaUploader";
import {
  accountSupportsPostKind,
  defaultPlatformSettings,
  formatLabel,
  type ComposerMedia,
  type PlatformSettings,
  type PostKind,
} from "./post-composer-config";

function defaultTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function toLocalInputValue(ms: number) {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInputValue(value: string) {
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
}

type Props = {
  initialScheduledFor?: number;
  /** Prefill from an existing post (calendar Duplicate). */
  duplicateFromId?: Id<"posts">;
  editPostId?: Id<"posts">;
};

type ComposerFormProps = Props & {
  initialPostKind: PostKind;
  onChooseDifferentFormat?: () => void;
};

type ComposerTool = "account" | "history" | null;

type TargetOptions = {
  bodyOverride: string;
  firstComment: string;
  referenceUrl: string;
  platformSettings: PlatformSettings;
};

const EMPTY_TARGET_OPTIONS: TargetOptions = {
  bodyOverride: "",
  firstComment: "",
  referenceUrl: "",
  platformSettings: {},
};

const REMEMBERED_ACCOUNTS_KEY = "multifeed:composer-accounts";

const normalizePlatformSettings = (settings: PlatformSettings) => ({
  ...settings,
  title: settings.title?.trim() || undefined,
  altText: settings.altText?.trim() || undefined,
  destinationUrl: settings.destinationUrl?.trim() || undefined,
  boardId: settings.boardId?.trim() || undefined,
  subreddit: settings.subreddit?.trim() || undefined,
});

export function CreatePostComposer(props: Props) {
  const isExistingPostFlow = Boolean(props.editPostId || props.duplicateFromId);
  const [selectedKind, setSelectedKind] = useState<PostKind | null>(null);

  if (!isExistingPostFlow && selectedKind === null) {
    return (
      <div className="flex flex-col gap-6">
        <DashboardPageTitle
          title="Create a new post"
          description="Choose the format first. You'll add accounts, content, and platform settings next."
        />
        <PostFormatPicker value={null} onChange={setSelectedKind} />
      </div>
    );
  }

  return (
    <PostComposerForm
      {...props}
      initialPostKind={selectedKind ?? "text"}
      onChooseDifferentFormat={
        isExistingPostFlow ? undefined : () => setSelectedKind(null)
      }
    />
  );
}

function PostComposerForm({
  initialScheduledFor,
  duplicateFromId,
  editPostId,
  initialPostKind,
  onChooseDifferentFormat,
}: ComposerFormProps) {
  const router = useRouter();
  const accounts = useQuery(api.oauth.accounts.list, {});
  const sourcePostId = editPostId ?? duplicateFromId;
  const sourcePost = useQuery(
    api.posts.get,
    sourcePostId ? { postId: sourcePostId } : "skip",
  );
  const createPost = useMutation(api.posts.create);
  const updatePost = useMutation(api.posts.update);
  const prefilledFrom = useRef<string | null>(null);
  const restoredRememberedAccounts = useRef(false);
  const pastPosts = useQuery(api.posts.list, { limit: 50 });

  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [postKind, setPostKind] = useState<PostKind>(initialPostKind);
  const [media, setMedia] = useState<ComposerMedia[]>([]);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetOptions, setTargetOptions] = useState<
    Record<string, TargetOptions>
  >({});
  const [captionSearch, setCaptionSearch] = useState("");
  const [activeTool, setActiveTool] = useState<ComposerTool>(null);
  const [rememberAccounts, setRememberAccounts] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule">(
    initialScheduledFor ? "schedule" : "now",
  );
  const [scheduleLocal, setScheduleLocal] = useState(() =>
    toLocalInputValue(initialScheduledFor ?? Date.now() + 60 * 60 * 1000),
  );
  const [timezone] = useState(defaultTimezone);
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState<"draft" | "schedule" | "now" | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const scheduleParts = useMemo(() => {
    const milliseconds = fromLocalInputValue(scheduleLocal);
    if (milliseconds === null) return null;
    const zoned = fromDate(new Date(milliseconds), timezone);
    return {
      date: new CalendarDate(zoned.year, zoned.month, zoned.day),
      time: new Time(zoned.hour, zoned.minute),
    };
  }, [scheduleLocal, timezone]);

  const updateSchedule = (date: DateValue | null, time: TimeValue | null) => {
    if (!date || !time) {
      setScheduleLocal("");
      return;
    }
    const dateTime = new CalendarDateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
      time.second,
    );
    const milliseconds = toZoned(dateTime, timezone).toDate().getTime();
    setScheduleLocal(toLocalInputValue(milliseconds));
  };

  const activeAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.status === "active"),
    [accounts],
  );

  // Prefill once when duplicating or editing an existing post.
  useEffect(() => {
    if (!sourcePost || !sourcePostId) return;
    if (prefilledFrom.current === sourcePostId) return;
    prefilledFrom.current = sourcePostId;

    setBody(sourcePost.body ?? "");
    setPostKind(sourcePost.kind);
    setMedia(
      sourcePost.mediaAssets.map((asset) => ({
        _id: asset._id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        kind: asset.kind,
        sizeBytes: asset.sizeBytes,
        publicUrl: asset.publicUrl,
        width: asset.width,
        height: asset.height,
        durationMs: asset.durationMs,
      })),
    );
    setTitle(
      sourcePost.title
        ? duplicateFromId
          ? `${sourcePost.title} (copy)`
          : sourcePost.title
        : "",
    );
    setNotes(sourcePost.notes ?? "");
    setShowNotes(Boolean(sourcePost.notes));
    const activeIds = new Set(
      (sourcePost.targets ?? [])
        .map((t) => t.connectedAccountId)
        .filter((id) =>
          (accounts ?? []).some((a) => a._id === id && a.status === "active"),
        ),
    );
    setSelected(activeIds);
    setTargetOptions(
      Object.fromEntries(
        (sourcePost.targets ?? []).map((target) => [
          target.connectedAccountId,
          {
            bodyOverride: target.bodyOverride ?? "",
            firstComment: target.firstComment ?? "",
            referenceUrl: target.referenceUrl ?? "",
            platformSettings: {
              ...defaultPlatformSettings(target.platform, sourcePost.kind),
              ...target.platformSettings,
            },
          },
        ]),
      ),
    );
    const nextSchedule =
      sourcePost.scheduledFor && sourcePost.scheduledFor > Date.now()
        ? sourcePost.scheduledFor
        : Date.now() + 60 * 60 * 1000;
    setScheduleLocal(toLocalInputValue(nextSchedule));
    setScheduleMode(
      sourcePost.status === "scheduled" &&
        Boolean(sourcePost.scheduledFor && sourcePost.scheduledFor > Date.now())
        ? "schedule"
        : "now",
    );
  }, [sourcePost, sourcePostId, duplicateFromId, accounts]);

  useEffect(() => {
    if (sourcePostId || accounts === undefined) return;
    if (restoredRememberedAccounts.current) return;
    restoredRememberedAccounts.current = true;

    try {
      const stored = window.localStorage.getItem(REMEMBERED_ACCOUNTS_KEY);
      if (!stored) return;
      const remembered = JSON.parse(stored) as string[];
      const activeIds = new Set(
        remembered.filter((id) =>
          accounts.some(
            (account) => account._id === id && account.status === "active",
          ),
        ),
      );
      window.queueMicrotask(() => {
        setRememberAccounts(true);
        setSelected(activeIds);
      });
    } catch {
      window.localStorage.removeItem(REMEMBERED_ACCOUNTS_KEY);
    }
  }, [accounts, sourcePostId]);

  useEffect(() => {
    if (!restoredRememberedAccounts.current || sourcePostId) return;
    if (!rememberAccounts) {
      window.localStorage.removeItem(REMEMBERED_ACCOUNTS_KEY);
      return;
    }
    window.localStorage.setItem(
      REMEMBERED_ACCOUNTS_KEY,
      JSON.stringify([...selected]),
    );
  }, [sourcePostId, rememberAccounts, selected]);

  const storyMediaKind =
    media[0]?.kind === "image" || media[0]?.kind === "video"
      ? media[0].kind
      : undefined;

  const compatibleAccounts = useMemo(
    () =>
      activeAccounts.filter((account) =>
        accountSupportsPostKind(account, postKind, storyMediaKind),
      ),
    [activeAccounts, postKind, storyMediaKind],
  );

  const selectedAccountIds = useMemo(() => {
    const compatibleIds = new Set<string>(
      compatibleAccounts.map((account) => account._id),
    );
    return new Set([...selected].filter((id) => compatibleIds.has(id)));
  }, [compatibleAccounts, selected]);

  const selectedPlatforms = useMemo(
    () => [
      ...new Set(
        compatibleAccounts
          .filter((account) => selectedAccountIds.has(account._id))
          .map((account) => account.platform),
      ),
    ],
    [compatibleAccounts, selectedAccountIds],
  );

  const strictestLimit = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    for (const p of selectedPlatforms) {
      const lim = PLATFORM_META[p]?.maxChars;
      if (lim != null && lim < min) min = lim;
    }
    return Number.isFinite(min) ? min : null;
  }, [selectedPlatforms]);

  const selectedAccounts = useMemo(
    () =>
      compatibleAccounts.filter((account) =>
        selectedAccountIds.has(account._id),
      ),
    [compatibleAccounts, selectedAccountIds],
  );

  const pastCaptions = useMemo(() => {
    const seen = new Set<string>();
    const query = captionSearch.trim().toLowerCase();
    return (pastPosts ?? [])
      .map((post) => post.body.trim())
      .filter((caption) => {
        if (!caption || seen.has(caption)) return false;
        seen.add(caption);
        return !query || caption.toLowerCase().includes(query);
      })
      .slice(0, 12);
  }, [captionSearch, pastPosts]);

  const overLimitAccounts = useMemo(
    () =>
      selectedAccounts.filter((account) => {
        const limit = PLATFORM_META[account.platform]?.maxChars;
        const effectiveBody =
          targetOptions[account._id]?.bodyOverride.trim() || body;
        return limit != null && effectiveBody.length > limit;
      }),
    [body, selectedAccounts, targetOptions],
  );

  const overLimit = overLimitAccounts.length > 0;
  const hasRequiredContent =
    postKind === "text" ? body.trim().length > 0 : media.length > 0;

  const toggleAccount = (id: string) => {
    if (!compatibleAccounts.some((account) => account._id === id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(compatibleAccounts.map((account) => account._id)));
  };

  const clearAll = () => setSelected(new Set());

  const chooseDifferentFormat = () => {
    media.forEach((asset) => {
      if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
    });
    onChooseDifferentFormat?.();
  };

  const updateTargetOptions = (
    accountId: string,
    patch: Partial<TargetOptions>,
  ) => {
    setTargetOptions((current) => ({
      ...current,
      [accountId]: {
        ...(current[accountId] ?? EMPTY_TARGET_OPTIONS),
        ...patch,
      },
    }));
  };

  const submit = async (mode: "draft" | "schedule" | "now") => {
    setError("");
    setSuccess("");
    setSaving(mode);

    try {
      const parsed = fromLocalInputValue(scheduleLocal);
      const scheduledFor: number | undefined =
        mode === "now" ? Date.now() : parsed === null ? undefined : parsed;

      if (mode === "schedule" && scheduledFor == null) {
        throw new Error("Choose a valid schedule date and time");
      }

      const targets = [...selectedAccountIds].map((connectedAccountId) => {
        const options = targetOptions[connectedAccountId];
        const account = activeAccounts.find(
          (candidate) => candidate._id === connectedAccountId,
        );
        const settings = {
          ...defaultPlatformSettings(account?.platform ?? "", postKind),
          ...options?.platformSettings,
        };
        return {
          connectedAccountId: connectedAccountId as Id<"connectedAccounts">,
          bodyOverride: options?.bodyOverride.trim() || undefined,
          firstComment: options?.firstComment.trim() || undefined,
          referenceUrl: options?.referenceUrl.trim() || undefined,
          platformSettings: normalizePlatformSettings(settings),
        };
      });
      const status =
        mode === "draft"
          ? ("draft" as const)
          : mode === "schedule"
            ? ("scheduled" as const)
            : ("publishing" as const);
      const payload = {
        title: title || undefined,
        body,
        kind: postKind,
        notes: notes || undefined,
        timezone,
        scheduledFor,
        mediaAssetIds: media.map((asset) => asset._id),
        targets,
      };
      const result = editPostId
        ? await updatePost({
            postId: editPostId,
            ...payload,
            status: status === "publishing" ? "scheduled" : status,
          }).then(() => ({ postId: editPostId }))
        : await createPost({ ...payload, status });

      if (mode === "draft") {
        setSuccess("Draft saved.");
        setSaving(null);
        return;
      }

      // "Post now" is stored as scheduled@now until a publisher worker exists.
      router.push(`/calendar?highlight=${result.postId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save post");
      setSaving(null);
    }
  };

  if (accounts === undefined || (sourcePostId && sourcePost === undefined)) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageTitle
        title={
          editPostId
            ? "Edit post"
            : duplicateFromId
              ? "Duplicate post"
              : "New post"
        }
        description={`Creating a ${formatLabel(postKind).toLowerCase()}. Choose accounts, add content, then customize each platform where needed.`}
        actions={
          onChooseDifferentFormat ? (
            <Button
              size="sm"
              variant="tertiary"
              onPress={chooseDifferentFormat}
            >
              <Icon icon="hugeicons:arrow-left-01" width={15} />
              Change type
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Composer */}
        <div className="flex flex-col gap-4">
          <section className="border-b border-border/70 pb-5">
            <div className="flex flex-row items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon icon="hugeicons:user-group-03" width={18} />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Publish to</h2>
                  <p className="text-sm text-muted">
                    {selectedAccountIds.size} of {compatibleAccounts.length}{" "}
                    compatible accounts selected
                  </p>
                </div>
              </div>
              <Checkbox
                isSelected={rememberAccounts}
                onChange={setRememberAccounts}
              >
                <Checkbox.Content>
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  Remember
                </Checkbox.Content>
              </Checkbox>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <div className="flex justify-end gap-1">
                <Button size="sm" variant="tertiary" onPress={selectAll}>
                  Select all
                </Button>
                <Button size="sm" variant="tertiary" onPress={clearAll}>
                  Clear
                </Button>
              </div>

              {activeAccounts.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-7 text-center">
                  <span className="mb-2 flex size-9 items-center justify-center text-muted">
                    <Icon icon="hugeicons:connect" width={18} />
                  </span>
                  <p className="text-sm font-medium">No active accounts yet</p>
                  <p className="mt-1 text-xs text-muted">
                    Connect a social account to start publishing.
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    className="mt-3"
                    onPress={() => router.push("/connections")}
                  >
                    <Icon icon="hugeicons:add-01" width={15} />
                    Connect accounts
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {activeAccounts.map((account) => {
                    const isOn = selectedAccountIds.has(account._id);
                    const isCompatible = compatibleAccounts.some(
                      (candidate) => candidate._id === account._id,
                    );
                    const brand = platformBrand(account.platform);
                    return (
                      <Button
                        key={account._id}
                        variant="tertiary"
                        isDisabled={!isCompatible}
                        onPress={() => toggleAccount(account._id)}
                        className={
                          isOn
                            ? "h-auto justify-start gap-3 rounded-xl border border-accent/40 bg-accent/5 px-3 py-2.5 text-left"
                            : "h-auto justify-start gap-3 rounded-xl border border-border/70 px-3 py-2.5 text-left hover:bg-surface-secondary"
                        }
                      >
                        {account.avatarUrl ? (
                          <RemoteAvatar
                            src={account.avatarUrl}
                            size={36}
                            className="size-9 rounded-full object-cover"
                          />
                        ) : (
                          <span
                            className="flex size-9 items-center justify-center rounded-full text-white"
                            style={{ backgroundColor: brand }}
                          >
                            <Icon
                              icon={
                                PLATFORM_META[account.platform]?.icon ??
                                "hugeicons:user"
                              }
                              width={15}
                            />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {account.displayName ?? account.username}
                          </p>
                          <p className="truncate text-xs text-muted">
                            {isCompatible
                              ? `${platformLabel(account.platform)} · @${account.username}`
                              : `Not available for ${formatLabel(postKind).toLowerCase()}`}
                          </p>
                        </div>
                        <span
                          className={
                            isOn
                              ? "flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground"
                              : "flex size-5 items-center justify-center rounded-full border border-border"
                          }
                        >
                          {isOn && <Icon icon="hugeicons:tick-02" width={12} />}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {postKind !== "text" && (
            <section className="border-b border-border/70 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-surface-secondary text-foreground">
                  <Icon
                    icon={
                      postKind === "image"
                        ? "hugeicons:image-02"
                        : postKind === "story"
                          ? "hugeicons:camera-01"
                          : "hugeicons:video-01"
                    }
                    width={18}
                  />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Media</h2>
                  <p className="text-sm text-muted">
                    {postKind === "image"
                      ? "Upload one image or build a carousel"
                      : postKind === "video"
                        ? "Upload once, then choose Reel, Short, or feed placement"
                        : "Use one vertical image or video"}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <PostMediaUploader
                  kind={postKind}
                  media={media}
                  onChange={setMedia}
                  onUploadingChange={setUploadingMedia}
                />
              </div>
            </section>
          )}

          <section className="border-b border-border/70 pb-5">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-surface-secondary text-foreground">
                  <Icon icon="hugeicons:edit-02" width={18} />
                </span>
                <div>
                  <h2 className="text-base font-semibold">
                    {formatLabel(postKind)}
                  </h2>
                  <p className="text-sm text-muted">
                    {postKind === "text"
                      ? "Write the post and add an optional internal title"
                      : "Add a caption and optional internal title"}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-title">Title (optional)</Label>
                <Input
                  id="post-title"
                  fullWidth
                  variant="secondary"
                  placeholder="Internal label for calendar"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-body">
                  {postKind === "text" ? "Post text" : "Caption (optional)"}
                </Label>
                <TextArea
                  id="post-body"
                  fullWidth
                  variant="secondary"
                  placeholder="What do you want to share?"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-36"
                />
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>
                    {selectedPlatforms.length > 0
                      ? `Writing for ${selectedPlatforms.map(platformLabel).join(", ")}`
                      : "Select accounts to see platform limits"}
                  </span>
                  <span
                    className={
                      overLimit ? "font-medium text-danger" : undefined
                    }
                  >
                    {body.length}
                    {strictestLimit != null ? ` / ${strictestLimit}` : ""}
                  </span>
                </div>
              </div>

              {overLimitAccounts.length > 0 && (
                <p className="rounded-xl bg-danger/10 px-3 py-2 text-xs text-danger">
                  Shorten the caption for{" "}
                  {overLimitAccounts
                    .map((account) => `@${account.username}`)
                    .join(", ")}
                  .
                </p>
              )}

              <div className="border-t border-border/70 pt-4">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                  Post tools
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={activeTool === "account" ? "primary" : "tertiary"}
                    onPress={() =>
                      setActiveTool((current) =>
                        current === "account" ? null : "account",
                      )
                    }
                  >
                    <Icon icon="hugeicons:layers-01" width={15} />
                    Account customizations
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTool === "history" ? "primary" : "tertiary"}
                    onPress={() =>
                      setActiveTool((current) =>
                        current === "history" ? null : "history",
                      )
                    }
                  >
                    <Icon icon="hugeicons:clock-01" width={15} />
                    Past captions
                  </Button>
                </div>
              </div>

              {activeTool === "account" && (
                <div className="flex flex-col gap-3 rounded-2xl bg-surface-secondary p-3">
                  {selectedAccounts.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted">
                      Select an account to customize its caption, placement, and
                      platform settings.
                    </p>
                  ) : (
                    selectedAccounts.map((account) => {
                      const options =
                        targetOptions[account._id] ?? EMPTY_TARGET_OPTIONS;
                      const platformSettings = {
                        ...defaultPlatformSettings(account.platform, postKind),
                        ...options.platformSettings,
                      };
                      const limit = PLATFORM_META[account.platform]?.maxChars;
                      const effectiveLength = (
                        options.bodyOverride.trim() || body
                      ).length;
                      return (
                        <div
                          key={account._id}
                          className="rounded-xl border border-border bg-surface p-3"
                        >
                          <div className="mb-3 flex items-center gap-2">
                            <span
                              className="flex size-7 items-center justify-center rounded-full text-white"
                              style={{
                                backgroundColor: platformBrand(
                                  account.platform,
                                ),
                              }}
                            >
                              <Icon
                                icon={
                                  PLATFORM_META[account.platform]?.icon ??
                                  "hugeicons:link-01"
                                }
                                width={12}
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">
                                @{account.username}
                              </p>
                              <p className="text-xs text-muted">
                                {platformLabel(account.platform)}
                              </p>
                            </div>
                            <span
                              className={
                                limit != null && effectiveLength > limit
                                  ? "text-xs font-medium text-danger"
                                  : "text-xs text-muted"
                              }
                            >
                              {effectiveLength}
                              {limit != null ? ` / ${limit}` : ""}
                            </span>
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1.5">
                              <Label htmlFor={`caption-${account._id}`}>
                                Custom caption
                              </Label>
                              <TextArea
                                id={`caption-${account._id}`}
                                fullWidth
                                variant="secondary"
                                placeholder="Leave blank to use the main caption"
                                value={options.bodyOverride}
                                onChange={(event) =>
                                  updateTargetOptions(account._id, {
                                    bodyOverride: event.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor={`comment-${account._id}`}>
                                  First comment
                                </Label>
                                <Input
                                  id={`comment-${account._id}`}
                                  fullWidth
                                  variant="secondary"
                                  placeholder="Optional follow-up"
                                  value={options.firstComment}
                                  onChange={(event) =>
                                    updateTargetOptions(account._id, {
                                      firstComment: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <Label htmlFor={`reference-${account._id}`}>
                                  Referenced post URL
                                </Label>
                                <Input
                                  id={`reference-${account._id}`}
                                  type="url"
                                  fullWidth
                                  variant="secondary"
                                  placeholder="Reply or quote URL"
                                  value={options.referenceUrl}
                                  onChange={(event) =>
                                    updateTargetOptions(account._id, {
                                      referenceUrl: event.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <PlatformSettingsFields
                              accountId={account._id}
                              platform={account.platform}
                              kind={postKind}
                              value={platformSettings}
                              onChange={(patch) =>
                                updateTargetOptions(account._id, {
                                  platformSettings: {
                                    ...platformSettings,
                                    ...patch,
                                  },
                                })
                              }
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTool === "history" && (
                <div className="flex flex-col gap-3 rounded-2xl bg-surface-secondary p-3">
                  <Input
                    aria-label="Search past captions"
                    fullWidth
                    variant="secondary"
                    placeholder="Search past captions"
                    value={captionSearch}
                    onChange={(event) => setCaptionSearch(event.target.value)}
                  />
                  {pastPosts === undefined ? (
                    <div className="flex justify-center py-6">
                      <Spinner size="sm" />
                    </div>
                  ) : pastCaptions.length === 0 ? (
                    <p className="py-5 text-center text-sm text-muted">
                      No matching captions yet.
                    </p>
                  ) : (
                    <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                      {pastCaptions.map((caption) => (
                        <Button
                          key={caption}
                          variant="tertiary"
                          onPress={() => {
                            setBody(caption);
                            setActiveTool(null);
                          }}
                          className="h-auto w-full justify-start rounded-xl border border-border bg-surface px-3 py-2 text-left text-sm leading-relaxed hover:border-accent/40"
                        >
                          <span className="line-clamp-2">{caption}</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                size="sm"
                variant="tertiary"
                className="w-fit"
                onPress={() => setShowNotes((value) => !value)}
              >
                <Icon
                  icon={
                    showNotes
                      ? "hugeicons:arrow-up-01"
                      : "hugeicons:arrow-down-01"
                  }
                  width={16}
                />
                Internal notes
              </Button>
              {showNotes && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="post-notes">Notes</Label>
                  <TextArea
                    id="post-notes"
                    fullWidth
                    variant="secondary"
                    placeholder="Reminders for your team — not posted publicly"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Live preview */}
          <section>
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-surface-secondary text-foreground">
                  <Icon icon="hugeicons:layers-01" width={18} />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Preview</h2>
                  <p className="text-sm text-muted">
                    How the caption reads on selected channels
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              {selectedAccountIds.size === 0 ? (
                <div className="flex flex-col items-center px-4 py-8 text-center">
                  <Icon
                    icon="hugeicons:note-01"
                    width={20}
                    className="mb-2 text-muted"
                  />
                  <p className="text-sm font-medium">Nothing to preview yet</p>
                  <p className="mt-1 text-xs text-muted">
                    Select an account to see its post preview.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {[...selectedAccountIds].slice(0, 3).map((id) => {
                    const acc = activeAccounts.find((a) => a._id === id);
                    if (!acc) return null;
                    const brand = platformBrand(acc.platform);
                    return (
                      <div
                        key={id}
                        className="rounded-2xl border border-border/70 p-4"
                      >
                        <div className="mb-3 flex items-center gap-2">
                          <span
                            className="flex size-8 items-center justify-center rounded-full text-white"
                            style={{ backgroundColor: brand }}
                          >
                            <Icon
                              icon={
                                PLATFORM_META[acc.platform]?.icon ??
                                "hugeicons:link-01"
                              }
                              width={14}
                            />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {acc.displayName ?? acc.username}
                            </p>
                            <p className="truncate text-xs text-muted">
                              {platformLabel(acc.platform)} · @{acc.username}
                            </p>
                          </div>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                          {targetOptions[id]?.bodyOverride.trim() ||
                            body.trim() || (
                              <span className="text-muted">Your caption…</span>
                            )}
                        </p>
                        {targetOptions[id]?.referenceUrl.trim() && (
                          <p className="mt-3 truncate rounded-lg bg-surface-secondary px-2.5 py-2 text-xs text-muted">
                            References {targetOptions[id].referenceUrl}
                          </p>
                        )}
                        {targetOptions[id]?.firstComment.trim() && (
                          <p className="mt-3 border-l-2 border-border pl-3 text-xs text-muted">
                            First comment: {targetOptions[id].firstComment}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  {selectedAccountIds.size > 3 && (
                    <p className="text-center text-xs text-muted">
                      +{selectedAccountIds.size - 3} more accounts
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <section className="border-t border-border/70 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon icon="hugeicons:clock-01" width={18} />
                </span>
                <div>
                  <h2 className="text-base font-semibold">When to publish</h2>
                  <p className="text-sm text-muted">
                    Post immediately or choose a time
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <Tabs
                className="w-full"
                selectedKey={scheduleMode}
                onSelectionChange={(key) =>
                  setScheduleMode(key as "now" | "schedule")
                }
              >
                <Tabs.ListContainer className="w-full">
                  <Tabs.List
                    aria-label="Publishing time"
                    className="grid w-full grid-cols-2"
                  >
                    <Tabs.Tab id="now">
                      Post now
                      <Tabs.Indicator />
                    </Tabs.Tab>
                    <Tabs.Tab id="schedule">
                      Schedule
                      <Tabs.Indicator />
                    </Tabs.Tab>
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>

              {scheduleMode === "schedule" && (
                <>
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px]">
                    <DatePicker
                      className="w-full"
                      value={scheduleParts?.date ?? null}
                      onChange={(date: DateValue | null) =>
                        updateSchedule(
                          date,
                          scheduleParts?.time ?? new Time(12, 0),
                        )
                      }
                    >
                      <Label>Date</Label>
                      <DateField.Group fullWidth variant="secondary">
                        <DateField.Input>
                          {(segment) => <DateField.Segment segment={segment} />}
                        </DateField.Input>
                        <DateField.Suffix>
                          <DatePicker.Trigger>
                            <DatePicker.TriggerIndicator />
                          </DatePicker.Trigger>
                        </DateField.Suffix>
                      </DateField.Group>
                      <DatePicker.Popover>
                        <Calendar aria-label="Schedule date">
                          <Calendar.Header>
                            <Calendar.YearPickerTrigger>
                              <Calendar.YearPickerTriggerHeading />
                              <Calendar.YearPickerTriggerIndicator />
                            </Calendar.YearPickerTrigger>
                            <Calendar.NavButton slot="previous" />
                            <Calendar.NavButton slot="next" />
                          </Calendar.Header>
                          <Calendar.Grid>
                            <Calendar.GridHeader>
                              {(day) => (
                                <Calendar.HeaderCell>{day}</Calendar.HeaderCell>
                              )}
                            </Calendar.GridHeader>
                            <Calendar.GridBody>
                              {(date) => <Calendar.Cell date={date} />}
                            </Calendar.GridBody>
                          </Calendar.Grid>
                          <Calendar.YearPickerGrid>
                            <Calendar.YearPickerGridBody>
                              {({ year }) => (
                                <Calendar.YearPickerCell year={year} />
                              )}
                            </Calendar.YearPickerGridBody>
                          </Calendar.YearPickerGrid>
                        </Calendar>
                      </DatePicker.Popover>
                    </DatePicker>

                    <TimeField
                      granularity="minute"
                      hourCycle={12}
                      value={scheduleParts?.time ?? null}
                      onChange={(time: TimeValue | null) =>
                        updateSchedule(scheduleParts?.date ?? null, time)
                      }
                    >
                      <Label>Time</Label>
                      <TimeField.Group fullWidth variant="secondary">
                        <TimeField.Input>
                          {(segment) => <TimeField.Segment segment={segment} />}
                        </TimeField.Input>
                      </TimeField.Group>
                    </TimeField>
                  </div>
                  {fromLocalInputValue(scheduleLocal) && (
                    <p className="text-xs text-muted">
                      {format(
                        new Date(fromLocalInputValue(scheduleLocal)!),
                        "EEE, MMM d · h:mm a",
                      )}{" "}
                      · {timezone}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { label: "+1h", kind: "1h" as const },
                        { label: "Tomorrow 9am", kind: "tomorrow" as const },
                        { label: "+1 week", kind: "week" as const },
                      ] as const
                    ).map((chip) => (
                      <Button
                        key={chip.label}
                        size="sm"
                        variant="tertiary"
                        className="rounded-full bg-surface-secondary"
                        onPress={() => {
                          if (chip.kind === "tomorrow") {
                            const date = new Date();
                            date.setDate(date.getDate() + 1);
                            date.setHours(9, 0, 0, 0);
                            setScheduleLocal(toLocalInputValue(date.getTime()));
                            return;
                          }
                          const offset =
                            chip.kind === "1h"
                              ? 60 * 60 * 1000
                              : 7 * 24 * 60 * 60 * 1000;
                          setScheduleLocal(
                            toLocalInputValue(Date.now() + offset),
                          );
                        }}
                      >
                        {chip.label}
                      </Button>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-1 flex flex-col gap-2 border-t border-border/70 pt-3">
                <Button
                  fullWidth
                  variant="primary"
                  isPending={saving === scheduleMode}
                  isDisabled={
                    !!saving ||
                    uploadingMedia ||
                    !hasRequiredContent ||
                    selectedAccountIds.size === 0 ||
                    overLimit
                  }
                  onPress={() => void submit(scheduleMode)}
                >
                  <Icon
                    icon={
                      scheduleMode === "schedule"
                        ? "hugeicons:calendar-check-in-01"
                        : "hugeicons:sent"
                    }
                    width={16}
                  />
                  {scheduleMode === "schedule" ? "Schedule post" : "Post now"}
                </Button>
                <Button
                  fullWidth
                  variant="tertiary"
                  isPending={saving === "draft"}
                  isDisabled={!!saving || uploadingMedia || !hasRequiredContent}
                  onPress={() => void submit("draft")}
                >
                  Save to drafts
                </Button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
