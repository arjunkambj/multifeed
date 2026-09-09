"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import { DashboardLoadingSkeleton } from "@/components/layout/DashboardLoadingSkeleton";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { RemoteAvatar } from "@/components/RemoteAvatar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { accountNeedsReconnect } from "@/lib/oauth/required-scopes";
import {
  PLATFORM_META,
  platformBrand,
  platformLabel,
} from "@/lib/platform-meta";
import { cn } from "@/lib/utils";
import { ComposerPanel } from "./ComposerPanel";
import { PlatformPostPreview } from "./PlatformPostPreview";
import { PlatformSettingsFields } from "./PlatformSettingsFields";
import { PostFormatPicker } from "./PostFormatPicker";
import { PostMediaUploader } from "./PostMediaUploader";
import {
  accountSupportsPostKind,
  type ComposerMedia,
  defaultPlatformSettings,
  formatLabel,
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

type ComposerFormProps = {
  composerData: FunctionReturnType<typeof api.posts.composerData> | undefined;
  initialScheduledFor?: number;
  duplicateFromId?: Id<"posts">;
  editPostId?: Id<"posts">;
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
  | { type: "mediaChanged"; value: ComposerMedia[] }
  | { type: "uploadingMediaChanged"; value: boolean }
  | { type: "selectedChanged"; value: Set<string> }
  | {
      type: "targetOptionsChanged";
      accountId: string;
      patch: Partial<TargetOptions>;
    }
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
    case "mediaChanged":
      return { ...state, media: action.value };
    case "uploadingMediaChanged":
      return { ...state, uploadingMedia: action.value };
    case "selectedChanged":
      return { ...state, selected: action.value };
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

export function CreatePostComposer() {
  const searchParams = useSearchParams();
  const editPostId =
    (searchParams.get("edit") as Id<"posts"> | null) ?? undefined;
  const duplicateFromId =
    (searchParams.get("from") as Id<"posts"> | null) ?? undefined;
  const at = searchParams.get("at");
  const initialScheduledFor = at ? Number(at) : undefined;
  const isExistingPostFlow = Boolean(editPostId || duplicateFromId);
  const composerData = useQuery(api.posts.composerData, {
    sourcePostId: editPostId ?? duplicateFromId,
  });
  const [selectedKind, setSelectedKind] = useState<PostKind | null>(null);

  if (!isExistingPostFlow && selectedKind === null) {
    return (
      <div className="flex flex-col gap-6">
        <DashboardPageTitle
          title="New post"
          description="Choose the format first. You'll add accounts, content, and platform settings next."
        />
        <PostFormatPicker
          accounts={composerData?.accounts}
          onChange={setSelectedKind}
        />
      </div>
    );
  }

  return (
    <PostComposerForm
      composerData={composerData}
      initialScheduledFor={
        initialScheduledFor && !Number.isNaN(initialScheduledFor)
          ? initialScheduledFor
          : undefined
      }
      duplicateFromId={duplicateFromId}
      editPostId={editPostId}
      initialPostKind={selectedKind ?? "text"}
      onChooseDifferentFormat={
        isExistingPostFlow ? undefined : () => setSelectedKind(null)
      }
    />
  );
}

function PostComposerForm({
  composerData,
  initialScheduledFor,
  duplicateFromId,
  editPostId,
  initialPostKind,
  onChooseDifferentFormat,
}: ComposerFormProps) {
  "use no memo";

  const router = useRouter();
  const sourcePostId = editPostId ?? duplicateFromId;
  const accounts = composerData?.accounts;
  const sourcePost = composerData?.sourcePost;
  const createPost = useMutation(api.posts.create);
  const updatePost = useMutation(api.posts.update);
  const prefilledFrom = useRef<string | null>(null);
  const [confirmFormatChange, setConfirmFormatChange] = useState(false);
  const [previewAccountId, setPreviewAccountId] = useState<string | null>(null);

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
  const [showPreview, setShowPreview] = useState(false);
  const accountPickerRef = useRef<HTMLDivElement>(null);

  const [scheduleDate = "", scheduleTime = ""] = scheduleLocal.split("T");
  const scheduleParts = { date: scheduleDate, time: scheduleTime };

  const updateSchedule = (date: string | null, time: string | null) => {
    dispatch({
      type: "scheduleLocalChanged",
      value: `${date ?? ""}T${time ?? ""}`,
    });
  };

  const activeAccounts = (accounts ?? []).filter(
    (account) => !accountNeedsReconnect(account),
  );

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
      (accounts ?? [])
        .filter((account) => !accountNeedsReconnect(account))
        .map((account) => account._id),
    );
    const activeIds = new Set(
      sourcePost.targets
        .filter((target) => activeAccountsSet.has(target.connectedAccountId))
        .map((target) => target.connectedAccountId),
    );
    const nextTargetOptions = Object.fromEntries(
      sourcePost.targets.map((target) => [
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
      body: sourcePost.body,
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

  const selectedAccounts = compatibleAccounts.filter((account) =>
    selectedAccountIds.has(account._id),
  );
  const previewAccount =
    selectedAccounts.find((account) => account._id === previewAccountId) ??
    selectedAccounts[0];
  const selectedPlatforms = [
    ...new Set(selectedAccounts.map((account) => account.platform)),
  ];

  const strictestLimit = (() => {
    let min = Number.POSITIVE_INFINITY;
    for (const p of selectedPlatforms) {
      const lim = PLATFORM_META[p]?.maxChars;
      if (lim != null && lim < min) min = lim;
    }
    return Number.isFinite(min) ? min : null;
  })();

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
    const effectiveBody =
      targetOptions[account._id]?.bodyOverride.trim() || body;
    return limit != null && effectiveBody.length > limit;
  });

  const overLimit = overLimitAccounts.length > 0;
  const hasRequiredContent =
    postKind === "text" ? body.trim().length > 0 : media.length > 0;
  const scheduledAt = fromLocalInputValue(scheduleLocal);
  const scheduleError =
    scheduleMode !== "schedule"
      ? null
      : scheduledAt === null
        ? "Choose a date and time."
        : scheduledAt <= Date.now()
          ? "Choose a time in the future."
          : null;
  const publishRequirements = [
    ...(selectedAccountIds.size === 0 ? ["Select at least one account."] : []),
    ...(!hasRequiredContent
      ? [
          postKind === "text"
            ? "Write your post text."
            : "Add media for this post.",
        ]
      : []),
    ...(uploadingMedia ? ["Wait for your media to finish uploading."] : []),
    ...(overLimit
      ? ["Shorten the captions that exceed their account limits."]
      : []),
    ...(scheduleError ? [scheduleError] : []),
  ];

  const selectAll = () => {
    dispatch({
      type: "selectedChanged",
      value: new Set(compatibleAccounts.map((account) => account._id)),
    });
  };

  const clearAll = () =>
    dispatch({ type: "selectedChanged", value: new Set() });

  const chooseDifferentFormat = () => {
    if (
      body.trim() ||
      title.trim() ||
      notes.trim() ||
      media.length > 0 ||
      selected.size > 0 ||
      Object.keys(targetOptions).length > 0
    ) {
      setConfirmFormatChange(true);
      return;
    }
    onChooseDifferentFormat?.();
  };

  const discardAndChangeFormat = () => {
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
    if (saving || uploadingMedia) return;
    dispatch({ type: "savingChanged", value: mode });

    const parsed = fromLocalInputValue(scheduleLocal);
    const scheduledFor: number | undefined =
      mode === "now" ? Date.now() : parsed === null ? undefined : parsed;
    if (
      mode === "schedule" &&
      (scheduledFor == null || scheduledFor <= Date.now())
    ) {
      dispatch({ type: "savingChanged", value: null });
      toast.error("Choose a date and time in the future.");
      return;
    }

    try {
      const targets = selectedAccounts.map((account) => {
        const connectedAccountId = account._id;
        const options = targetOptions[connectedAccountId];
        const settings = {
          ...defaultPlatformSettings(account.platform, postKind),
          ...options?.platformSettings,
        };
        return {
          connectedAccountId,
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
            status,
          }).then(() => ({ postId: editPostId }))
        : await createPost({ ...payload, status });

      if (mode === "draft") {
        toast.success("Draft saved.");
        if (!editPostId) router.replace(`/posts/new?edit=${result.postId}`);
        dispatch({ type: "savingChanged", value: null });
        return;
      }

      toast.success(
        mode === "schedule" ? "Post scheduled." : "Post publishing.",
      );
      router.push(`/calendar?highlight=${result.postId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save post");
      dispatch({ type: "savingChanged", value: null });
    }
  };

  if (accounts === undefined || (sourcePostId && sourcePost === undefined)) {
    return <DashboardLoadingSkeleton variant="composer" />;
  }

  return (
    <div className="flex w-full min-w-0 max-w-6xl flex-col gap-5 pb-4">
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
              variant="secondary"
              disabled={uploadingMedia || saving !== null}
              onClick={chooseDifferentFormat}
            >
              <Icon icon="hugeicons:arrow-left-01" width={15} />
              Change format
            </Button>
          ) : undefined
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold">
                  Publish to
                  {compatibleAccounts.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {selectedAccountIds.size} selected
                    </span>
                  )}
                </h2>
                {compatibleAccounts.length > 1 && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        selectedAccountIds.size === compatibleAccounts.length
                      }
                      onClick={selectAll}
                    >
                      Select all
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={selectedAccountIds.size === 0}
                      onClick={clearAll}
                    >
                      Clear
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div>
              {activeAccounts.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-[min(var(--radius-4xl),24px)] bg-muted px-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    {(accounts ?? []).length > 0
                      ? "Connected accounts need a reconnect before they can publish."
                      : "Connect a social account to publish this post."}
                  </p>
                  <Button size="sm" onClick={() => router.push("/connections")}>
                    {(accounts ?? []).length > 0
                      ? "Reconnect accounts"
                      : "Connect accounts"}
                  </Button>
                </div>
              ) : compatibleAccounts.length === 0 ? (
                <div className="flex flex-col items-start gap-3 rounded-[min(var(--radius-4xl),24px)] bg-muted px-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    None of your connected accounts support this format. Connect
                    a matching network or pick a different type.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => router.push("/connections")}
                    >
                      Manage connections
                    </Button>
                    {onChooseDifferentFormat ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-background"
                        onClick={chooseDifferentFormat}
                        disabled={uploadingMedia || saving !== null}
                      >
                        Change format
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <ToggleGroup
                  ref={accountPickerRef}
                  multiple
                  aria-label="Publish to accounts"
                  value={[...selectedAccountIds]}
                  onValueChange={(value) =>
                    dispatch({ type: "selectedChanged", value: new Set(value) })
                  }
                  className="flex max-w-full flex-wrap justify-start"
                >
                  {compatibleAccounts.map((account) => {
                    const isOn = selectedAccountIds.has(account._id);
                    const brand = platformBrand(account.platform);
                    const label =
                      account.displayName?.trim() || `@${account.username}`;
                    const platformName = platformLabel(account.platform);
                    return (
                      <ToggleGroupItem
                        key={account._id}
                        value={account._id}
                        aria-label={`${label} on ${platformName} (@${account.username})`}
                        className="h-11 gap-2 rounded-xl py-0 pl-1.5 pr-3"
                      >
                        <span className="relative size-8 shrink-0">
                          {account.avatarUrl ? (
                            <RemoteAvatar
                              src={account.avatarUrl}
                              size={32}
                              className="size-8 rounded-full object-cover"
                            />
                          ) : (
                            <span className="flex size-8 items-center justify-center rounded-full bg-card text-xs font-semibold text-foreground">
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
                            className="shrink-0 text-primary"
                          />
                        )}
                      </ToggleGroupItem>
                    );
                  })}
                </ToggleGroup>
              )}
            </div>
          </section>

          <Separator />

          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-5">
              <div className="flex min-w-0 flex-col gap-5">
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

                <FieldGroup className="min-w-0">
                  <Field>
                    <FieldLabel htmlFor="post-title">
                      Title
                      {selectedPlatforms.includes("youtube") && (
                        <span className="font-normal text-muted-foreground">
                          (also used as your YouTube title)
                        </span>
                      )}
                    </FieldLabel>
                    <Input
                      id="post-title"
                      placeholder="Add a title"
                      value={title}
                      onChange={(e) =>
                        dispatch({
                          type: "titleChanged",
                          value: e.target.value,
                        })
                      }
                    />
                  </Field>
                  <Field data-invalid={overLimit}>
                    <div className="flex items-center justify-between gap-2">
                      <FieldLabel htmlFor="post-body">
                        {postKind === "text" ? "Post text" : "Caption"}
                      </FieldLabel>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          overLimit
                            ? "font-medium text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {body.length}
                        {strictestLimit != null ? ` / ${strictestLimit}` : ""}
                      </span>
                    </div>
                    <Textarea
                      id="post-body"
                      aria-invalid={overLimit}
                      aria-describedby={
                        overLimit ? "post-body-error" : undefined
                      }
                      placeholder="What do you want to share?"
                      value={body}
                      onChange={(e) =>
                        dispatch({ type: "bodyChanged", value: e.target.value })
                      }
                      className="min-h-32 resize-y"
                    />
                  </Field>

                  {overLimitAccounts.length > 0 && (
                    <p
                      id="post-body-error"
                      className="text-xs text-destructive"
                    >
                      Too long for{" "}
                      {overLimitAccounts
                        .map((account) => `@${account.username}`)
                        .join(", ")}
                    </p>
                  )}
                </FieldGroup>
              </div>

              <div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={activeTool === "account" ? "secondary" : "ghost"}
                    disabled={selectedAccountIds.size === 0}
                    aria-expanded={activeTool === "account"}
                    aria-controls="composer-account-settings"
                    onClick={() =>
                      dispatch({
                        type: "toolChanged",
                        value: activeTool === "account" ? null : "account",
                      })
                    }
                  >
                    <Icon icon="hugeicons:layers-01" width={15} />
                    Account settings
                  </Button>
                  <Button
                    size="sm"
                    variant={activeTool === "history" ? "secondary" : "ghost"}
                    aria-expanded={activeTool === "history"}
                    aria-controls="composer-caption-history"
                    onClick={() =>
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
                    variant={showNotes ? "secondary" : "ghost"}
                    aria-expanded={showNotes}
                    aria-controls="composer-notes"
                    onClick={() => dispatch({ type: "notesVisibilityToggled" })}
                  >
                    <Icon
                      icon="hugeicons:arrow-down-01"
                      data-icon="inline-start"
                      className={cn(
                        "transition-transform duration-200 ease-in-out motion-reduce:transition-none",
                        showNotes && "rotate-180",
                      )}
                    />
                    Notes
                  </Button>
                </div>

                <ComposerPanel
                  id="composer-account-settings"
                  open={activeTool === "account"}
                >
                  <div className="flex flex-col gap-5">
                    {selectedAccounts.length === 0 ? (
                      <p className="py-3 text-center text-sm text-muted-foreground">
                        Select an account to customize its caption and settings.
                      </p>
                    ) : (
                      selectedAccounts.map((account) => {
                        const options =
                          targetOptions[account._id] ?? EMPTY_TARGET_OPTIONS;
                        const platformSettings = {
                          ...defaultPlatformSettings(
                            account.platform,
                            postKind,
                          ),
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
                                <p className="text-xs text-muted-foreground">
                                  {platformLabel(account.platform)}
                                </p>
                              </div>
                              <span
                                className={
                                  limit != null && effectiveLength > limit
                                    ? "text-xs font-medium text-red-600"
                                    : "text-xs text-muted-foreground"
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
                                <Textarea
                                  id={`caption-${account._id}`}
                                  placeholder="Leave blank to use the main caption"
                                  value={options.bodyOverride}
                                  onChange={(event) =>
                                    updateTargetOptions(account._id, {
                                      bodyOverride: event.target.value,
                                    })
                                  }
                                />
                              </div>
                              {(
                                [
                                  "x",
                                  "facebook",
                                  "instagram",
                                  "linkedin",
                                  "threads",
                                ] as const
                              ).includes(account.platform as "x") && (
                                <div className="flex flex-col gap-1.5">
                                  <Label htmlFor={`comment-${account._id}`}>
                                    First comment
                                  </Label>
                                  <Input
                                    id={`comment-${account._id}`}
                                    placeholder="Optional follow-up"
                                    value={options.firstComment}
                                    onChange={(event) =>
                                      updateTargetOptions(account._id, {
                                        firstComment: event.target.value,
                                      })
                                    }
                                  />
                                </div>
                              )}
                              {account.platform === "x" && (
                                <div className="flex flex-col gap-1.5">
                                  <Label htmlFor={`reference-${account._id}`}>
                                    Reply to post URL
                                  </Label>
                                  <Input
                                    id={`reference-${account._id}`}
                                    type="url"
                                    placeholder="https://x.com/.../status/..."
                                    value={options.referenceUrl}
                                    onChange={(event) =>
                                      updateTargetOptions(account._id, {
                                        referenceUrl: event.target.value,
                                      })
                                    }
                                  />
                                </div>
                              )}
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
                </ComposerPanel>

                <ComposerPanel
                  id="composer-caption-history"
                  open={activeTool === "history"}
                >
                  <div className="flex flex-col gap-3">
                    <Input
                      aria-label="Search past captions"
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
                      <div className="flex flex-col gap-2 py-2">
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-8 w-4/5 rounded-lg" />
                        <Skeleton className="h-8 w-3/5 rounded-lg" />
                      </div>
                    ) : pastCaptions.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        No matching captions yet.
                      </p>
                    ) : (
                      <div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
                        {pastCaptions.map((caption) => (
                          <Button
                            key={caption}
                            variant="outline"
                            onClick={() => {
                              dispatch({ type: "bodyChanged", value: caption });
                              dispatch({ type: "toolChanged", value: null });
                            }}
                            className="h-auto w-full justify-start rounded-xl bg-muted px-3 py-2 text-left text-sm leading-relaxed"
                          >
                            <span className="line-clamp-2">{caption}</span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                </ComposerPanel>

                <ComposerPanel id="composer-notes" open={showNotes}>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="post-notes">Internal notes</Label>
                    <Textarea
                      id="post-notes"
                      placeholder="Team reminders, only visible to your team"
                      value={notes}
                      onChange={(e) =>
                        dispatch({
                          type: "notesChanged",
                          value: e.target.value,
                        })
                      }
                    />
                  </div>
                </ComposerPanel>
              </div>
            </div>
          </section>

          <Separator />

          <section className="flex min-w-0 flex-col">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold">When to publish</h2>
              <ToggleGroup
                aria-label="Publishing time"
                variant="outline"
                className="grid w-full grid-cols-2 rounded-xl bg-muted/50 p-1 sm:w-auto"
                value={[scheduleMode]}
                onValueChange={([value]) => {
                  if (value !== "now" && value !== "schedule") return;
                  dispatch({
                    type: "scheduleModeChanged",
                    value,
                  });
                }}
              >
                <ToggleGroupItem
                  value="now"
                  className="gap-2 px-4 duration-200 motion-reduce:transition-none"
                >
                  <Icon icon="hugeicons:sent" data-icon="inline-start" />
                  Now
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="schedule"
                  aria-controls="composer-schedule"
                  className="gap-2 px-4 duration-200 motion-reduce:transition-none"
                >
                  <Icon icon="hugeicons:calendar-03" data-icon="inline-start" />
                  Schedule
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <ComposerPanel
              id="composer-schedule"
              open={scheduleMode === "schedule"}
            >
              <FieldGroup className="grid max-w-md gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                <Field>
                  <FieldLabel htmlFor="schedule-date">Date</FieldLabel>
                  <DatePicker
                    id="schedule-date"
                    minDate={new Date()}
                    aria-label="Date"
                    className="h-8"
                    value={
                      scheduleParts?.date
                        ? new Date(`${scheduleParts.date}T00:00:00`)
                        : undefined
                    }
                    onChange={(date) => {
                      const pad = (n: number) => String(n).padStart(2, "0");
                      updateSchedule(
                        `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
                        scheduleParts?.time ?? "12:00",
                      );
                    }}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="schedule-time">Time</FieldLabel>
                  <Input
                    id="schedule-time"
                    type="time"
                    value={scheduleParts?.time ?? ""}
                    onChange={(event) =>
                      updateSchedule(
                        scheduleParts?.date ?? null,
                        event.currentTarget.value || null,
                      )
                    }
                  />
                </Field>
              </FieldGroup>
              {fromLocalInputValue(scheduleLocal) && (
                <p className="text-xs text-muted-foreground">
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
                    variant="secondary"
                    onClick={() => {
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
            </ComposerPanel>
            <div className="mt-4 flex flex-col gap-4">
              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div
                  id="publish-requirements"
                  aria-live="polite"
                  className="min-w-0 text-xs text-muted-foreground"
                >
                  {publishRequirements.length > 0 ? (
                    <p>{publishRequirements.join(" ")}</p>
                  ) : (
                    <p>
                      Ready to{" "}
                      {scheduleMode === "schedule"
                        ? "schedule for"
                        : "publish to"}{" "}
                      {selectedAccountIds.size}{" "}
                      {selectedAccountIds.size === 1 ? "account" : "accounts"}.
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row-reverse">
                  <Button
                    className="sm:min-w-40"
                    variant="default"
                    disabled={
                      !!saving ||
                      uploadingMedia ||
                      !hasRequiredContent ||
                      selectedAccountIds.size === 0 ||
                      overLimit ||
                      scheduleError !== null
                    }
                    aria-describedby="publish-requirements"
                    onClick={() => void submit(scheduleMode)}
                  >
                    {saving === scheduleMode ? (
                      <Spinner className="size-4" />
                    ) : (
                      <Icon
                        icon={
                          scheduleMode === "schedule"
                            ? "hugeicons:calendar-check-in-01"
                            : "hugeicons:sent"
                        }
                        width={16}
                      />
                    )}
                    {saving === scheduleMode
                      ? scheduleMode === "schedule"
                        ? "Scheduling…"
                        : "Publishing…"
                      : scheduleMode === "schedule"
                        ? "Schedule post"
                        : "Publish post"}
                  </Button>
                  <Button
                    className="sm:mr-auto"
                    variant="outline"
                    disabled={!!saving || uploadingMedia || !hasRequiredContent}
                    onClick={() => void submit("draft")}
                  >
                    {saving === "draft" ? <Spinner className="size-4" /> : null}
                    Save draft
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside
          className="min-w-0 rounded-2xl bg-muted/30 p-4 lg:sticky lg:top-6 lg:self-start"
          aria-label="Post preview"
        >
          <section className="flex min-w-0 flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Live preview</h2>
              <Button
                size="sm"
                variant="ghost"
                className="lg:hidden"
                aria-expanded={showPreview}
                aria-controls="composer-preview"
                onClick={() => setShowPreview((visible) => !visible)}
              >
                {showPreview ? "Hide" : "Show"}
                <Icon
                  icon={
                    showPreview
                      ? "hugeicons:arrow-up-01"
                      : "hugeicons:arrow-down-01"
                  }
                  data-icon="inline-end"
                />
              </Button>
            </div>
            <div
              id="composer-preview"
              className={cn(
                "min-w-0 flex-col gap-4 lg:flex",
                showPreview ? "flex" : "hidden",
              )}
            >
              {selectedAccounts.length > 1 && (
                <ToggleGroup
                  aria-label="Preview account"
                  className="w-full flex-wrap justify-start"
                  value={previewAccount ? [previewAccount._id] : []}
                  onValueChange={([value]) => {
                    if (value) setPreviewAccountId(value);
                  }}
                >
                  {selectedAccounts.map((account) => (
                    <ToggleGroupItem
                      key={account._id}
                      value={account._id}
                      aria-label={`Preview @${account.username} on ${platformLabel(account.platform)}`}
                    >
                      <Icon
                        icon={
                          PLATFORM_META[account.platform]?.icon ??
                          "hugeicons:link-01"
                        }
                      />
                      <span className="max-w-32 truncate">
                        @{account.username}
                      </span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              )}
              {previewAccount ? (
                <div className="mx-auto flex w-full max-w-[520px] justify-center">
                  <PlatformPostPreview
                    account={previewAccount}
                    body={
                      targetOptions[previewAccount._id]?.bodyOverride.trim() ||
                      body.trim()
                    }
                    firstComment={
                      targetOptions[previewAccount._id]?.firstComment.trim() ||
                      undefined
                    }
                    media={media}
                    platformSettings={{
                      ...defaultPlatformSettings(
                        previewAccount.platform,
                        postKind,
                      ),
                      ...targetOptions[previewAccount._id]?.platformSettings,
                    }}
                    postKind={postKind}
                    referenceUrl={
                      targetOptions[previewAccount._id]?.referenceUrl.trim() ||
                      undefined
                    }
                    title={title}
                  />
                </div>
              ) : (
                <Empty className="min-h-72 px-4 py-8">
                  <EmptyHeader>
                    <EmptyMedia aria-hidden>
                      <div className="relative mb-3 flex h-28 w-24 -rotate-6 flex-col gap-2 rounded-xl border border-border bg-background p-3 shadow-sm">
                        <div className="absolute inset-0 -z-10 translate-x-2 rotate-12 rounded-xl border border-border bg-background" />
                        <div className="flex flex-1 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                          <Icon icon="hugeicons:image-02" width={24} />
                        </div>
                        <div className="h-1.5 w-12 rounded-full bg-muted" />
                        <div className="h-1.5 w-8 rounded-full bg-muted" />
                      </div>
                    </EmptyMedia>
                    <EmptyTitle>No account selected</EmptyTitle>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        if (compatibleAccounts.length === 0) {
                          router.push("/connections");
                          return;
                        }
                        accountPickerRef.current
                          ?.querySelector<HTMLButtonElement>("button")
                          ?.focus();
                      }}
                    >
                      {compatibleAccounts.length > 0
                        ? "Choose an account"
                        : "Connect an account"}
                      <Icon
                        icon="hugeicons:arrow-up-right-01"
                        data-icon="inline-end"
                      />
                    </Button>
                  </EmptyContent>
                </Empty>
              )}
              {previewAccount && (
                <p className="text-center text-xs text-muted-foreground">
                  Appearance may vary by platform.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
      <Dialog open={confirmFormatChange} onOpenChange={setConfirmFormatChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change post format?</DialogTitle>
            <DialogDescription>
              This clears the content and account selections in this editor.
              Save a draft first if you want to keep them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setConfirmFormatChange(false)}
            >
              Keep editing
            </Button>
            <Button variant="destructive" onClick={discardAndChangeFormat}>
              Discard and change format
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
