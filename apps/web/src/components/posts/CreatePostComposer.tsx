"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  Input,
  Label,
  Skeleton,
  Tabs,
  TextArea,
  TimeField,
  toast,
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
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { ComposerFormSkeleton } from "@/components/layout/ComposerFormSkeleton";
import { RemoteAvatar } from "@/components/RemoteAvatar";
import {
  PLATFORM_META,
  platformBrand,
  platformLabel,
} from "@/lib/platform-meta";
import { PlatformSettingsFields } from "./PlatformSettingsFields";
import { PlatformPostPreview } from "./PlatformPostPreview";
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

const currentTimestamp = () => Date.now();

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

const normalizePlatformSettings = (settings: PlatformSettings) => ({
  ...settings,
  title: settings.title?.trim() || undefined,
  altText: settings.altText?.trim() || undefined,
});

type ComposerState = {
  body: string;
  title: string;
  notes: string;
  postKind: PostKind;
  media: ComposerMedia[];
  uploadingMedia: boolean;
  selected: Set<string>;
  targetOptions: Record<string, TargetOptions>;
  captionSearch: string;
  activeTool: ComposerTool;
  scheduleMode: "now" | "schedule";
  scheduleLocal: string;
  showNotes: boolean;
  saving: "draft" | "schedule" | "now" | null;
};

type ComposerAction =
  | { type: "bodyChanged"; value: string }
  | { type: "titleChanged"; value: string }
  | { type: "notesChanged"; value: string }
  | { type: "postKindChanged"; value: PostKind }
  | { type: "mediaChanged"; value: ComposerMedia[] }
  | { type: "uploadingMediaChanged"; value: boolean }
  | { type: "selectedChanged"; value: Set<string> }
  | { type: "accountToggled"; accountId: string }
  | { type: "targetOptionsChanged"; accountId: string; patch: Partial<TargetOptions> }
  | { type: "captionSearchChanged"; value: string }
  | { type: "toolChanged"; value: ComposerTool }
  | { type: "scheduleModeChanged"; value: "now" | "schedule" }
  | { type: "scheduleLocalChanged"; value: string }
  | { type: "notesVisibilityToggled" }
  | { type: "savingChanged"; value: ComposerState["saving"] }
  | {
      type: "sourceLoaded";
      body: string;
      title: string;
      notes: string;
      postKind: PostKind;
      media: ComposerMedia[];
      selected: Set<string>;
      targetOptions: Record<string, TargetOptions>;
      scheduleMode: "now" | "schedule";
      scheduleLocal: string;
      showNotes: boolean;
    };

const createComposerState = (
  initialPostKind: PostKind,
  initialScheduledFor?: number,
): ComposerState => ({
  body: "",
  title: "",
  notes: "",
  postKind: initialPostKind,
  media: [],
  uploadingMedia: false,
  selected: new Set(),
  targetOptions: {},
  captionSearch: "",
  activeTool: null,
  scheduleMode: initialScheduledFor ? "schedule" : "now",
  scheduleLocal: toLocalInputValue(
    initialScheduledFor ?? Date.now() + 60 * 60 * 1000,
  ),
  showNotes: false,
  saving: null,
});

function composerReducer(
  state: ComposerState,
  action: ComposerAction,
): ComposerState {
  switch (action.type) {
    case "bodyChanged":
      return { ...state, body: action.value };
    case "titleChanged":
      return { ...state, title: action.value };
    case "notesChanged":
      return { ...state, notes: action.value };
    case "postKindChanged":
      return { ...state, postKind: action.value };
    case "mediaChanged":
      return { ...state, media: action.value };
    case "uploadingMediaChanged":
      return { ...state, uploadingMedia: action.value };
    case "selectedChanged":
      return { ...state, selected: action.value };
    case "accountToggled": {
      const selected = new Set(state.selected);
      if (selected.has(action.accountId)) selected.delete(action.accountId);
      else selected.add(action.accountId);
      return { ...state, selected };
    }
    case "targetOptionsChanged":
      return {
        ...state,
        targetOptions: {
          ...state.targetOptions,
          [action.accountId]: {
            ...(state.targetOptions[action.accountId] ?? EMPTY_TARGET_OPTIONS),
            ...action.patch,
          },
        },
      };
    case "captionSearchChanged":
      return { ...state, captionSearch: action.value };
    case "toolChanged":
      return { ...state, activeTool: action.value };
    case "scheduleModeChanged":
      return { ...state, scheduleMode: action.value };
    case "scheduleLocalChanged":
      return { ...state, scheduleLocal: action.value };
    case "notesVisibilityToggled":
      return { ...state, showNotes: !state.showNotes };
    case "savingChanged":
      return { ...state, saving: action.value };
    case "sourceLoaded":
      return {
        ...state,
        body: action.body,
        title: action.title,
        notes: action.notes,
        postKind: action.postKind,
        media: action.media,
        selected: action.selected,
        targetOptions: action.targetOptions,
        scheduleMode: action.scheduleMode,
        scheduleLocal: action.scheduleLocal,
        showNotes: action.showNotes,
      };
  }
}

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
        <PostFormatPicker onChange={setSelectedKind} />
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

function PostComposerForm(props: ComposerFormProps) {
  return usePostComposerForm(props);
}

function usePostComposerForm({
  initialScheduledFor,
  duplicateFromId,
  editPostId,
  initialPostKind,
  onChooseDifferentFormat,
}: ComposerFormProps) {
  "use no memo";

  const router = useRouter();
  const sourcePostId = editPostId ?? duplicateFromId;
  const composerData = useQuery(api.posts.composerData, { sourcePostId });
  const accounts = composerData?.accounts;
  const sourcePost = composerData?.sourcePost;
  const createPost = useMutation(api.posts.create);
  const updatePost = useMutation(api.posts.update);
  const prefilledFrom = useRef<string | null>(null);

  const [state, dispatch] = useReducer(
    composerReducer,
    { initialPostKind, initialScheduledFor },
    ({ initialPostKind: kind, initialScheduledFor: scheduledFor }) =>
      createComposerState(kind, scheduledFor),
  );
  const {
    body,
    title,
    notes,
    postKind,
    media,
    uploadingMedia,
    selected,
    targetOptions,
    captionSearch,
    activeTool,
    scheduleMode,
    scheduleLocal,
    showNotes,
    saving,
  } = state;
  const recentCaptions = useQuery(
    api.posts.recentCaptions,
    activeTool === "history" ? { limit: 50 } : "skip",
  );
  const [timezone] = useState(defaultTimezone);

  const scheduleParts = (() => {
    const milliseconds = fromLocalInputValue(scheduleLocal);
    if (milliseconds === null) return null;
    const zoned = fromDate(new Date(milliseconds), timezone);
    return {
      date: new CalendarDate(zoned.year, zoned.month, zoned.day),
      time: new Time(zoned.hour, zoned.minute),
    };
  })();

  const updateSchedule = (date: DateValue | null, time: TimeValue | null) => {
    if (!date || !time) {
      dispatch({ type: "scheduleLocalChanged", value: "" });
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
    dispatch({
      type: "scheduleLocalChanged",
      value: toLocalInputValue(milliseconds),
    });
  };

  const activeAccounts = (accounts ?? []).filter((a) => a.status === "active");

  // Prefill once when duplicating or editing an existing post.
  useEffect(() => {
    if (!sourcePost || !sourcePostId) return;
    if (prefilledFrom.current === sourcePostId) return;
    prefilledFrom.current = sourcePostId;

    const nextMedia = sourcePost.mediaAssets.map((asset) => ({
        _id: asset._id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        kind: asset.kind,
        sizeBytes: asset.sizeBytes,
        publicUrl: asset.publicUrl,
        width: asset.width,
        height: asset.height,
        durationMs: asset.durationMs,
    }));
    const activeAccountsSet = new Set(
      (accounts ?? []).reduce<Id<"connectedAccounts">[]>((acc, a) => {
        if (a.status === "active") acc.push(a._id);
        return acc;
      }, []),
    );
    const activeIds = new Set(
      (sourcePost.targets ?? []).reduce<Id<"connectedAccounts">[]>((acc, t) => {
        if (activeAccountsSet.has(t.connectedAccountId)) {
          acc.push(t.connectedAccountId);
        }
        return acc;
      }, []),
    );
    const nextTargetOptions = Object.fromEntries(
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
    );
    const nextSchedule =
      sourcePost.scheduledFor && sourcePost.scheduledFor > Date.now()
        ? sourcePost.scheduledFor
        : Date.now() + 60 * 60 * 1000;
    dispatch({
      type: "sourceLoaded",
      body: sourcePost.body ?? "",
      title: sourcePost.title
        ? duplicateFromId
          ? `${sourcePost.title} (copy)`
          : sourcePost.title
        : "",
      notes: sourcePost.notes ?? "",
      postKind: sourcePost.kind,
      media: nextMedia,
      selected: activeIds,
      targetOptions: nextTargetOptions,
      scheduleLocal: toLocalInputValue(nextSchedule),
      scheduleMode:
        sourcePost.status === "scheduled" &&
        Boolean(sourcePost.scheduledFor && sourcePost.scheduledFor > Date.now())
          ? "schedule"
          : "now",
      showNotes: Boolean(sourcePost.notes),
    });
  }, [sourcePost, sourcePostId, duplicateFromId, accounts]);

  const storyMediaKind =
    media[0]?.kind === "image" || media[0]?.kind === "video"
      ? media[0].kind
      : undefined;

  const compatibleAccounts = activeAccounts.filter((account) =>
    accountSupportsPostKind(account, postKind, storyMediaKind),
  );

  const selectedAccountIds = (() => {
    const compatibleIds = new Set<string>(
      compatibleAccounts.map((account) => account._id),
    );
    return new Set([...selected].filter((id) => compatibleIds.has(id)));
  })();

  const selectedPlatforms = [
    ...new Set(
      compatibleAccounts.reduce<string[]>((acc, account) => {
        if (selectedAccountIds.has(account._id)) acc.push(account.platform);
        return acc;
      }, []),
    ),
  ];

  const strictestLimit = (() => {
    let min = Number.POSITIVE_INFINITY;
    for (const p of selectedPlatforms) {
      const lim = PLATFORM_META[p]?.maxChars;
      if (lim != null && lim < min) min = lim;
    }
    return Number.isFinite(min) ? min : null;
  })();

  const selectedAccounts = compatibleAccounts.filter((account) =>
    selectedAccountIds.has(account._id),
  );

  const pastCaptions = (() => {
    const seen = new Set<string>();
    const query = captionSearch.trim().toLowerCase();
    return (recentCaptions ?? [])
      .filter((caption) => {
        if (!caption || seen.has(caption)) return false;
        seen.add(caption);
        return !query || caption.toLowerCase().includes(query);
      })
      .slice(0, 12);
  })();

  const overLimitAccounts = selectedAccounts.filter((account) => {
    const limit = PLATFORM_META[account.platform]?.maxChars;
    const effectiveBody = targetOptions[account._id]?.bodyOverride.trim() || body;
    return limit != null && effectiveBody.length > limit;
  });

  const overLimit = overLimitAccounts.length > 0;
  const hasRequiredContent =
    postKind === "text" ? body.trim().length > 0 : media.length > 0;

  const toggleAccount = (id: string) => {
    if (!compatibleAccounts.some((account) => account._id === id)) return;
    dispatch({ type: "accountToggled", accountId: id });
  };

  const selectAll = () => {
    dispatch({
      type: "selectedChanged",
      value: new Set(compatibleAccounts.map((account) => account._id)),
    });
  };

  const clearAll = () =>
    dispatch({ type: "selectedChanged", value: new Set() });

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
    dispatch({ type: "targetOptionsChanged", accountId, patch });
  };

  const submit = async (mode: "draft" | "schedule" | "now") => {
    dispatch({ type: "savingChanged", value: mode });

    const parsed = fromLocalInputValue(scheduleLocal);
    const scheduledFor: number | undefined =
      mode === "now"
        ? currentTimestamp()
        : parsed === null
          ? undefined
          : parsed;
    if (mode === "schedule" && scheduledFor == null) {
      dispatch({ type: "savingChanged", value: null });
      toast.danger("Choose a valid schedule date and time", { timeout: 3000 });
      return;
    }

    try {
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
        toast.success("Draft saved.", { timeout: 3000 });
        dispatch({ type: "savingChanged", value: null });
        return;
      }

      // "Post now" is stored as scheduled@now until a publisher worker exists.
      toast.success(
        mode === "schedule" ? "Post scheduled." : "Post queued for publishing.",
        { timeout: 3000 },
      );
      router.push(`/calendar?highlight=${result.postId}`);
    } catch (err) {
      toast.danger(err instanceof Error ? err.message : "Could not save post", {
        timeout: 3000,
      });
      dispatch({ type: "savingChanged", value: null });
    }
  };

  if (accounts === undefined || (sourcePostId && sourcePost === undefined)) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true" role="status">
        <span className="sr-only">Loading composer</span>
        <ComposerFormSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardPageTitle
        title={
          editPostId
            ? "Edit post"
            : duplicateFromId
              ? "Duplicate post"
              : "New post"
        }
        description={formatLabel(postKind)}
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-6">
          {/* Publish to */}
          <section className="border-b border-border/70 pb-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">
                Publish to
                {compatibleAccounts.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    {selectedAccountIds.size}/{compatibleAccounts.length}
                  </span>
                )}
              </h2>
              {compatibleAccounts.length > 0 && (
                <div className="flex gap-1">
                  <Button size="sm" variant="tertiary" onPress={selectAll}>
                    Select all
                  </Button>
                  <Button size="sm" variant="tertiary" onPress={clearAll}>
                    Clear
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-3">
              {activeAccounts.length === 0 ? (
                <p className="text-sm text-muted">
                  No accounts connected.{" "}
                  <button
                    type="button"
                    className="font-medium text-accent hover:underline"
                    onClick={() => router.push("/connections")}
                  >
                    Connect accounts
                  </button>
                </p>
              ) : compatibleAccounts.length === 0 ? (
                <p className="text-sm text-muted">
                  No accounts support this format.{" "}
                  <button
                    type="button"
                    className="font-medium text-accent hover:underline"
                    onClick={() => router.push("/connections")}
                  >
                    Manage connections
                  </button>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {compatibleAccounts.map((account) => {
                    const isOn = selectedAccountIds.has(account._id);
                    const brand = platformBrand(account.platform);
                    const label =
                      account.displayName?.trim() || `@${account.username}`;
                    const platformName = platformLabel(account.platform);
                    return (
                      <Button
                        key={account._id}
                        size="sm"
                        variant="tertiary"
                        onPress={() => toggleAccount(account._id)}
                        aria-label={`${label} on ${platformName} (@${account.username})`}
                        className={
                          isOn
                            ? "h-10 gap-2 rounded-full bg-accent/10 py-0 pl-1 pr-3 ring-1 ring-accent/40"
                            : "h-10 gap-2 rounded-full bg-surface-secondary py-0 pl-1 pr-3 hover:bg-surface-tertiary"
                        }
                      >
                        <span className="relative size-8 shrink-0">
                          {account.avatarUrl ? (
                            <RemoteAvatar
                              src={account.avatarUrl}
                              size={32}
                              className="size-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex size-8 items-center justify-center rounded-full bg-surface text-xs font-semibold text-foreground">
                              {label.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                          <span
                            className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center"
                            aria-hidden
                          >
                            <Icon
                              icon={
                                PLATFORM_META[account.platform]?.icon ??
                                "hugeicons:link-01"
                              }
                              width={12}
                              style={{ color: brand }}
                              className="shrink-0 drop-shadow-[0_0_1px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_0_1px_rgba(0,0,0,0.8)]"
                            />
                          </span>
                        </span>
                        <span className="max-w-32 truncate text-sm font-medium leading-none text-foreground">
                          @{account.username}
                        </span>
                        {isOn && (
                          <Icon
                            icon="hugeicons:tick-02"
                            width={14}
                            className="shrink-0 text-accent"
                          />
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Content */}
          <section className="border-b border-border/70 pb-5">
            <div className="flex flex-col gap-4">
              <div
                className={
                  postKind === "text"
                    ? ""
                    : "grid items-start gap-5 md:grid-cols-2"
                }
              >
                {postKind !== "text" && (
                  <div className="min-w-0">
                    <h2 className="mb-3 text-base font-semibold">Media</h2>
                    <PostMediaUploader
                      kind={postKind}
                      media={media}
                      onChange={(value) =>
                        dispatch({ type: "mediaChanged", value })
                      }
                      onUploadingChange={(value) =>
                        dispatch({ type: "uploadingMediaChanged", value })
                      }
                    />
                  </div>
                )}

                <div className="flex min-w-0 flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="post-title">Title</Label>
                    <Input
                      id="post-title"
                      fullWidth
                      variant="secondary"
                      placeholder="Optional calendar label"
                      value={title}
                      onChange={(e) =>
                        dispatch({ type: "titleChanged", value: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="post-body">
                        {postKind === "text" ? "Post text" : "Caption"}
                      </Label>
                      <span
                        className={[
                          "text-xs tabular-nums",
                          overLimit ? "font-medium text-danger" : "text-muted",
                        ].join(" ")}
                      >
                        {body.length}
                        {strictestLimit != null ? ` / ${strictestLimit}` : ""}
                      </span>
                    </div>
                    <TextArea
                      id="post-body"
                      fullWidth
                      variant="secondary"
                      placeholder="What do you want to share?"
                      value={body}
                      onChange={(e) =>
                        dispatch({ type: "bodyChanged", value: e.target.value })
                      }
                      className="min-h-36"
                    />
                  </div>

                  {overLimitAccounts.length > 0 && (
                    <p className="text-xs text-danger">
                      Too long for{" "}
                      {overLimitAccounts
                        .map((account) => `@${account.username}`)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
                <Button
                  size="sm"
                  variant={activeTool === "account" ? "primary" : "tertiary"}
                  onPress={() =>
                    dispatch({
                      type: "toolChanged",
                      value: activeTool === "account" ? null : "account",
                    })
                  }
                >
                  <Icon icon="hugeicons:layers-01" width={15} />
                  Customize accounts
                </Button>
                <Button
                  size="sm"
                  variant={activeTool === "history" ? "primary" : "tertiary"}
                  onPress={() =>
                    dispatch({
                      type: "toolChanged",
                      value: activeTool === "history" ? null : "history",
                    })
                  }
                >
                  <Icon icon="hugeicons:clock-01" width={15} />
                  Past captions
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => dispatch({ type: "notesVisibilityToggled" })}
                >
                  <Icon
                    icon={
                      showNotes
                        ? "hugeicons:arrow-up-01"
                        : "hugeicons:arrow-down-01"
                    }
                    width={15}
                  />
                  Notes
                </Button>
              </div>

              {activeTool === "account" && (
                <div className="flex flex-col gap-5">
                  {selectedAccounts.length === 0 ? (
                    <p className="py-3 text-center text-sm text-muted">
                      Select an account to customize its caption and settings.
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
                          className="border-b border-border/70 pb-5 last:border-b-0 last:pb-0"
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
                <div className="flex flex-col gap-3">
                  <Input
                    aria-label="Search past captions"
                    fullWidth
                    variant="secondary"
                    placeholder="Search past captions"
                    value={captionSearch}
                    onChange={(event) =>
                      dispatch({
                        type: "captionSearchChanged",
                        value: event.target.value,
                      })
                    }
                  />
                  {recentCaptions === undefined ? (
                    <div className="space-y-2 py-2">
                      <Skeleton className="h-8 w-full rounded-lg" />
                      <Skeleton className="h-8 w-4/5 rounded-lg" />
                      <Skeleton className="h-8 w-3/5 rounded-lg" />
                    </div>
                  ) : pastCaptions.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted">
                      No matching captions yet.
                    </p>
                  ) : (
                    <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                      {pastCaptions.map((caption) => (
                        <Button
                          key={caption}
                          variant="tertiary"
                          onPress={() => {
                            dispatch({ type: "bodyChanged", value: caption });
                            dispatch({ type: "toolChanged", value: null });
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

              {showNotes && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="post-notes">Internal notes</Label>
                  <TextArea
                    id="post-notes"
                    fullWidth
                    variant="secondary"
                    placeholder="Team reminders — not posted publicly"
                    value={notes}
                    onChange={(e) =>
                      dispatch({ type: "notesChanged", value: e.target.value })
                    }
                  />
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Preview</h2>
            {selectedAccountIds.size === 0 ? (
              <p className="text-sm text-muted">
                Select accounts above to preview.
              </p>
            ) : (
              <div className="flex items-start gap-4 overflow-x-auto pb-2">
                {[...selectedAccountIds].map((id) => {
                  const acc = activeAccounts.find((a) => a._id === id);
                  if (!acc) return null;
                  const options = targetOptions[id] ?? EMPTY_TARGET_OPTIONS;
                  const platformSettings = {
                    ...defaultPlatformSettings(acc.platform, postKind),
                    ...options.platformSettings,
                  };
                  return (
                    <PlatformPostPreview
                      key={id}
                      account={acc}
                      body={options.bodyOverride.trim() || body.trim()}
                      firstComment={options.firstComment.trim() || undefined}
                      media={media}
                      platformSettings={platformSettings}
                      postKind={postKind}
                      referenceUrl={options.referenceUrl.trim() || undefined}
                      title={title}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <section className="border-t border-border/70 pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <h2 className="mb-3 text-base font-semibold">Publish</h2>
            <div className="flex flex-col gap-3">
              <Tabs
                className="w-full"
                selectedKey={scheduleMode}
                onSelectionChange={(key) =>
                  dispatch({
                    type: "scheduleModeChanged",
                    value: key as "now" | "schedule",
                  })
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
                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_112px] lg:grid-cols-1">
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
                      <DatePicker.Popover
                        className="max-w-none"
                        placement="bottom end"
                      >
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
                            dispatch({
                              type: "scheduleLocalChanged",
                              value: toLocalInputValue(date.getTime()),
                            });
                            return;
                          }
                          const offset =
                            chip.kind === "1h"
                              ? 60 * 60 * 1000
                              : 7 * 24 * 60 * 60 * 1000;
                          dispatch({
                            type: "scheduleLocalChanged",
                            value: toLocalInputValue(Date.now() + offset),
                          });
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
