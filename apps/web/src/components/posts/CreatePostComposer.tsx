"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, Label, Spinner, TextArea } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import {
  PLATFORM_META,
  platformBrand,
  platformLabel,
} from "@/lib/platform-meta";

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
};

export function CreatePostComposer({
  initialScheduledFor,
  duplicateFromId,
}: Props) {
  const router = useRouter();
  const accounts = useQuery(api.oauth.accounts.list, {});
  const sourcePost = useQuery(
    api.posts.get,
    duplicateFromId ? { postId: duplicateFromId } : "skip",
  );
  const createPost = useMutation(api.posts.create);
  const prefilledFrom = useRef<string | null>(null);

  const [body, setBody] = useState("");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [scheduleLocal, setScheduleLocal] = useState(() =>
    toLocalInputValue(
      initialScheduledFor ?? Date.now() + 60 * 60 * 1000,
    ),
  );
  const [timezone] = useState(defaultTimezone);
  const [showNotes, setShowNotes] = useState(false);
  const [saving, setSaving] = useState<"draft" | "schedule" | "now" | null>(
    null,
  );
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeAccounts = useMemo(
    () => (accounts ?? []).filter((a) => a.status === "active"),
    [accounts],
  );

  // Prefill once when duplicating an existing post.
  useEffect(() => {
    if (!sourcePost || !duplicateFromId) return;
    if (prefilledFrom.current === duplicateFromId) return;
    prefilledFrom.current = duplicateFromId;

    setBody(sourcePost.body ?? "");
    setTitle(sourcePost.title ? `${sourcePost.title} (copy)` : "");
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
    const nextSchedule =
      sourcePost.scheduledFor && sourcePost.scheduledFor > Date.now()
        ? sourcePost.scheduledFor
        : Date.now() + 60 * 60 * 1000;
    setScheduleLocal(toLocalInputValue(nextSchedule));
  }, [sourcePost, duplicateFromId, accounts]);

  const selectedPlatforms = useMemo(() => {
    const platforms = new Set<string>();
    for (const id of selected) {
      const acc = activeAccounts.find((a) => a._id === id);
      if (acc) platforms.add(acc.platform);
    }
    return [...platforms];
  }, [selected, activeAccounts]);

  const strictestLimit = useMemo(() => {
    let min = Number.POSITIVE_INFINITY;
    for (const p of selectedPlatforms) {
      const lim = PLATFORM_META[p]?.maxChars;
      if (lim != null && lim < min) min = lim;
    }
    return Number.isFinite(min) ? min : null;
  }, [selectedPlatforms]);

  const overLimit = strictestLimit != null && body.length > strictestLimit;

  const toggleAccount = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(activeAccounts.map((a) => a._id)));
  };

  const clearAll = () => setSelected(new Set());

  const submit = async (mode: "draft" | "schedule" | "now") => {
    setError("");
    setSuccess("");
    setSaving(mode);

    try {
      const parsed = fromLocalInputValue(scheduleLocal);
      const scheduledFor: number | undefined =
        mode === "now"
          ? Date.now()
          : parsed === null
            ? undefined
            : parsed;

      if (mode === "schedule" && scheduledFor == null) {
        throw new Error("Choose a valid schedule date and time");
      }

      const result = await createPost({
        title: title || undefined,
        body,
        notes: notes || undefined,
        timezone,
        scheduledFor,
        status:
          mode === "draft" ? "draft" : mode === "schedule" ? "scheduled" : "publishing",
        targets: [...selected].map((connectedAccountId) => ({
          connectedAccountId: connectedAccountId as Id<"connectedAccounts">,
        })),
      });

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

  if (accounts === undefined || (duplicateFromId && sourcePost === undefined)) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <DashboardPageTitle
            title={duplicateFromId ? "Duplicate post" : "New post"}
          />
          <p className="mt-1 max-w-xl text-sm text-muted">
            Write once, pick accounts, schedule on the calendar. “Post now”
            queues for immediate publish once the publisher is online.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="tertiary"
            size="sm"
            isPending={saving === "draft"}
            isDisabled={!!saving}
            onPress={() => void submit("draft")}
          >
            Save draft
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isPending={saving === "schedule"}
            isDisabled={!!saving || overLimit}
            onPress={() => void submit("schedule")}
          >
            <Icon icon="hugeicons:calendar-check-in-01" width={16} />
            Schedule
          </Button>
          <Button
            variant="primary"
            size="sm"
            isPending={saving === "now"}
            isDisabled={!!saving || overLimit}
            onPress={() => void submit("now")}
          >
            <Icon icon="hugeicons:sent" width={16} />
            Post now
          </Button>
        </div>
      </div>

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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Composer */}
        <div className="flex flex-col gap-4">
          <Card className="border border-border bg-surface shadow-none">
            <Card.Header className="pb-2">
              <Card.Title className="text-base">Composer</Card.Title>
              <Card.Description>
                Caption and optional internal title
              </Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-title">Title (optional)</Label>
                <Input
                  id="post-title"
                  fullWidth
                  placeholder="Internal label for calendar"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-body">Caption</Label>
                <TextArea
                  id="post-body"
                  fullWidth
                  placeholder="What do you want to share?"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="min-h-44"
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

              <button
                type="button"
                className="flex items-center gap-2 text-left text-sm text-muted transition hover:text-foreground"
                onClick={() => setShowNotes((v) => !v)}
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
              </button>
              {showNotes && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="post-notes">Notes</Label>
                  <TextArea
                    id="post-notes"
                    fullWidth
                    placeholder="Reminders for your team — not posted publicly"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Live preview */}
          <Card className="border border-border bg-surface shadow-none">
            <Card.Header className="pb-2">
              <Card.Title className="text-base">Preview</Card.Title>
              <Card.Description>
                How the caption reads on selected channels
              </Card.Description>
            </Card.Header>
            <Card.Content>
              {selected.size === 0 ? (
                <p className="rounded-xl bg-surface-secondary px-4 py-8 text-center text-sm text-muted">
                  Select accounts to preview
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {[...selected].slice(0, 3).map((id) => {
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
                          {body.trim() || (
                            <span className="text-muted">Your caption…</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                  {selected.size > 3 && (
                    <p className="text-center text-xs text-muted">
                      +{selected.size - 3} more accounts
                    </p>
                  )}
                </div>
              )}
            </Card.Content>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="border border-border bg-surface shadow-none">
            <Card.Header className="flex flex-row items-center justify-between pb-2">
              <div>
                <Card.Title className="text-base">Accounts</Card.Title>
                <Card.Description>
                  {selected.size} selected
                </Card.Description>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="tertiary" onPress={selectAll}>
                  All
                </Button>
                <Button size="sm" variant="tertiary" onPress={clearAll}>
                  None
                </Button>
              </div>
            </Card.Header>
            <Card.Content className="flex max-h-72 flex-col gap-1.5 overflow-y-auto">
              {activeAccounts.length === 0 ? (
                <div className="rounded-xl bg-surface-secondary px-3 py-6 text-center">
                  <p className="text-sm text-muted">No active accounts</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    onPress={() => router.push("/connections")}
                  >
                    Connect accounts
                  </Button>
                </div>
              ) : (
                activeAccounts.map((account) => {
                  const isOn = selected.has(account._id);
                  const brand = platformBrand(account.platform);
                  return (
                    <button
                      key={account._id}
                      type="button"
                      onClick={() => toggleAccount(account._id)}
                      className={
                        isOn
                          ? "flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/5 px-3 py-2 text-left transition"
                          : "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 text-left transition hover:bg-surface-secondary"
                      }
                    >
                      {account.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={account.avatarUrl}
                          alt=""
                          className="size-8 rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="flex size-8 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: brand }}
                        >
                          <Icon
                            icon={
                              PLATFORM_META[account.platform]?.icon ??
                              "hugeicons:user"
                            }
                            width={14}
                          />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {account.displayName ?? account.username}
                        </p>
                        <p className="truncate text-xs text-muted">
                          {platformLabel(account.platform)} · @{account.username}
                        </p>
                      </div>
                      <span
                        className={
                          isOn
                            ? "flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground"
                            : "flex size-5 items-center justify-center rounded-full border border-border"
                        }
                      >
                        {isOn && (
                          <Icon icon="hugeicons:tick-02" width={12} />
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </Card.Content>
          </Card>

          <Card className="border border-border bg-surface shadow-none">
            <Card.Header className="pb-2">
              <Card.Title className="text-base">Schedule</Card.Title>
              <Card.Description>Timezone: {timezone}</Card.Description>
            </Card.Header>
            <Card.Content className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="post-schedule">Date & time</Label>
                <Input
                  id="post-schedule"
                  type="datetime-local"
                  fullWidth
                  value={scheduleLocal}
                  onChange={(e) => setScheduleLocal(e.target.value)}
                />
              </div>
              {fromLocalInputValue(scheduleLocal) && (
                <p className="text-xs text-muted">
                  Local:{" "}
                  {format(
                    new Date(fromLocalInputValue(scheduleLocal)!),
                    "EEE, MMM d · h:mm a",
                  )}
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
                  <button
                    key={chip.label}
                    type="button"
                    className="rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-surface-tertiary"
                    onClick={() => {
                      if (chip.kind === "tomorrow") {
                        const d = new Date();
                        d.setDate(d.getDate() + 1);
                        d.setHours(9, 0, 0, 0);
                        setScheduleLocal(toLocalInputValue(d.getTime()));
                        return;
                      }
                      const ms =
                        chip.kind === "1h"
                          ? 60 * 60 * 1000
                          : 7 * 24 * 60 * 60 * 1000;
                      setScheduleLocal(toLocalInputValue(Date.now() + ms));
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </Card.Content>
          </Card>

          <Card className="border border-dashed border-border bg-surface-secondary/40 shadow-none">
            <Card.Content className="flex items-start gap-3 py-4">
              <Icon
                icon="hugeicons:image-add-01"
                width={22}
                className="mt-0.5 text-muted"
              />
              <div>
                <p className="text-sm font-medium">Media</p>
                <p className="mt-0.5 text-xs text-muted">
                  Image & video upload via R2 is ready on the backend — wire
                  media picker in the next pass. Text posts work now.
                </p>
              </div>
            </Card.Content>
          </Card>
        </div>
      </div>
    </div>
  );
}
