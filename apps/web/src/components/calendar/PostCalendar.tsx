"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { CalendarGridSkeleton } from "@/components/layout/CalendarGridSkeleton";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultCalendarRangeMs } from "@/lib/date-ranges";
import {
  PLATFORM_META,
  platformBrand,
  platformForeground,
  platformLabel,
} from "@/lib/platform-meta";
import { cn } from "@/lib/utils";

type CalendarView = "dayGridMonth" | "timeGridWeek";

const VIEWS: { id: CalendarView; label: string; icon: string }[] = [
  { id: "dayGridMonth", label: "Month", icon: "hugeicons:calendar-03" },
  { id: "timeGridWeek", label: "Week", icon: "hugeicons:calendar-02" },
];

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-primary/15 text-primary",
  publishing: "bg-amber-500/15 text-amber-500",
  published: "bg-emerald-500/15 text-emerald-600",
  failed: "bg-red-500/15 text-red-600",
  draft: "bg-muted text-muted-foreground",
};

export function PostCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlight = searchParams.get("highlight");
  const calendarRef = useRef<FullCalendar>(null);

  const [view, setView] = useState<CalendarView>("dayGridMonth");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [range, setRange] = useState(defaultCalendarRangeMs);
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(
    (highlight as Id<"posts">) || null,
  );
  const [title, setTitle] = useState("");

  const postsResult = useQuery(api.posts.listInRange, {
    startMs: range.startMs,
    endMs: range.endMs,
  });
  const posts = postsResult?.posts;
  const selectedPost = useQuery(
    api.posts.get,
    selectedPostId ? { postId: selectedPostId } : "skip",
  );
  const reschedule = useMutation(api.posts.reschedule);
  const removePost = useMutation(api.posts.remove);

  const platformOptions = [
    ...new Set(
      (posts ?? []).flatMap((post) =>
        post.targets.map((target) => target.platform),
      ),
    ),
  ].sort();

  const events: EventInput[] = (posts ?? [])
    .filter(
      (post) =>
        platformFilter === "all" ||
        post.targets.some((target) => target.platform === platformFilter),
    )
    .map((post) => {
      const platform = post.targets[0]?.platform ?? "x";
      return {
        id: post._id,
        title:
          post.title?.trim() || post.body.trim().slice(0, 48) || "Untitled post",
        start: post.scheduledFor,
        backgroundColor: post.calendarColor ?? platformBrand(platform),
        borderColor: "transparent",
        textColor: post.calendarColor
          ? "#fff"
          : platformForeground(platform),
        editable: post.status === "scheduled" || post.status === "failed",
        extendedProps: {
          status: post.status,
          platforms: [
            ...new Set(post.targets.map((target) => target.platform)),
          ].join(", "),
          body: post.body,
        },
      };
    });

  const onDatesSet = (arg: DatesSetArg) => {
    const startMs = arg.start.getTime();
    const endMs = arg.end.getTime();
    setTitle(arg.view.title);
    setView(arg.view.type as CalendarView);
    setRange((current) => {
      if (current.startMs === startMs && current.endMs === endMs) {
        return current;
      }
      return { startMs, endMs };
    });
  };

  const changeView = (next: CalendarView) => {
    const api = calendarRef.current?.getApi();
    api?.changeView(next);
    setView(next);
  };

  const goToday = () => calendarRef.current?.getApi().today();
  const goPrev = () => calendarRef.current?.getApi().prev();
  const goNext = () => calendarRef.current?.getApi().next();

  const onEventClick = (info: EventClickArg) => {
    setSelectedPostId(info.event.id as Id<"posts">);
  };

  const onSelect = (info: DateSelectArg) => {
    const ms = info.start.getTime();
    router.push(`/posts/new?at=${ms}`);
  };

  const onEventDrop = async (info: EventDropArg) => {
    const start = info.event.start;
    if (!start) {
      info.revert();
      return;
    }
    try {
      await reschedule({
        postId: info.event.id as Id<"posts">,
        scheduledFor: start.getTime(),
      });
      toast.success("Post rescheduled.");
    } catch (error) {
      info.revert();
      toast.error(
        error instanceof Error ? error.message : "Could not reschedule post",
      );
    }
  };

  const onDelete = async () => {
    if (!selectedPostId) return;
    try {
      await removePost({ postId: selectedPostId });
      setSelectedPostId(null);
      toast.success("Post deleted.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete post",
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <DashboardPageTitle
        title="Calendar"
        description="Month and week — drag to reschedule."
        actions={
          <Button onClick={() => router.push("/posts/new")}>
            <Icon icon="hugeicons:add-01" width={16} />
            New post
          </Button>
        }
      />

      <div
        className={
          selectedPostId
            ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"
            : "grid"
        }
      >
        <div className="flex min-w-0 flex-col gap-3 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <ButtonGroup
                aria-label="Calendar period"
                className="rounded-xl bg-secondary"
              >
                <Button
                  aria-label="Previous period"
                  size="icon"
                  variant="outline"
                  onClick={goPrev}
                >
                  <Icon icon="hugeicons:arrow-left-01" width={16} />
                </Button>
                <Button variant="outline" onClick={goToday}>
                  Today
                </Button>
                <Button
                  aria-label="Next period"
                  size="icon"
                  variant="outline"
                  onClick={goNext}
                >
                  <Icon icon="hugeicons:arrow-right-01" width={16} />
                </Button>
              </ButtonGroup>
              <h2 className="text-base font-semibold tracking-tight">
                {title || "…"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                items={[
                  { value: "all", label: "All platforms" },
                  ...platformOptions.map((platform) => ({
                    value: platform,
                    label: platformLabel(platform),
                  })),
                ]}
                value={platformFilter}
                onValueChange={(value) =>
                  setPlatformFilter(String(value ?? "all"))
                }
              >
                <SelectTrigger
                  aria-label="Filter calendar by platform"
                  className="w-40"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All platforms</SelectItem>
                    {platformOptions.map((platform) => (
                      <SelectItem key={platform} value={platform}>
                        {platformLabel(platform)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Tabs
                value={view}
                onValueChange={(key) => changeView(key as CalendarView)}
              >
                <TabsList aria-label="Calendar view">
                  {VIEWS.map((item) => (
                    <TabsTrigger key={item.id} value={item.id}>
                      <Icon icon={item.icon} width={14} />
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="multifeed-calendar relative min-h-[640px] overflow-hidden rounded-2xl border-4 border-card bg-background">
            {posts === undefined && (
              <div className="absolute inset-0 z-10 bg-background">
                <CalendarGridSkeleton />
              </div>
            )}
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              height={640}
              events={events}
              editable
              selectable
              selectMirror
              expandRows
              dayMaxEvents={3}
              nowIndicator
              weekends
              fixedWeekCount={false}
              dayHeaderFormat={{ weekday: "short" }}
              datesSet={onDatesSet}
              eventClick={onEventClick}
              select={onSelect}
              eventDrop={(info) => void onEventDrop(info)}
              eventClassNames={(arg) =>
                cn(
                  "multifeed-cal-event",
                  arg.event.id === selectedPostId &&
                    "multifeed-cal-event-selected",
                )
              }
              views={{
                dayGridMonth: { dayMaxEventRows: 3 },
                timeGridWeek: {
                  slotMinTime: "06:00:00",
                  slotMaxTime: "24:00:00",
                },
              }}
            />
          </div>
        </div>

        {selectedPostId && (
          <PostDetailsCard
            selectedPost={selectedPost}
            onClose={() => setSelectedPostId(null)}
            onDelete={onDelete}
            router={router}
          />
        )}
      </div>
    </div>
  );
}

function PostDetailsCard({
  selectedPost,
  onClose,
  onDelete,
  router,
}: {
  selectedPost: ReturnType<typeof useQuery<typeof api.posts.get>>;
  onClose: () => void;
  onDelete: () => Promise<void>;
  router: ReturnType<typeof useRouter>;
}) {
  const retryFailed = useMutation(api.posts.retryFailed);
  const [retrying, setRetrying] = useState(false);

  const onRetry = async () => {
    if (!selectedPost || retrying) return;
    setRetrying(true);
    try {
      const { retried } = await retryFailed({ postId: selectedPost._id });
      toast.success(
        `Retrying ${retried} failed ${retried === 1 ? "delivery" : "deliveries"}.`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not retry post",
      );
    } finally {
      setRetrying(false);
    }
  };

  return (
    <Card className="bg-card shadow-none xl:sticky xl:top-4 xl:self-start">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Post details</CardTitle>
        <CardDescription>Review or jump into editing</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedPost === undefined && (
          <div className="flex flex-col gap-4 py-2">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-4 w-3/5 rounded-lg" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        )}

        {selectedPost === null && (
          <p className="text-sm text-muted-foreground">Post not found.</p>
        )}

        {selectedPost && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[selectedPost.status] ?? STATUS_STYLE.draft}`}
              >
                {selectedPost.status}
              </span>
              {selectedPost.scheduledFor && (
                <span className="text-xs text-muted-foreground">
                  {format(
                    new Date(selectedPost.scheduledFor),
                    "EEE, MMM d · h:mm a",
                  )}
                </span>
              )}
            </div>

            {selectedPost.title && (
              <h3 className="text-sm font-semibold">{selectedPost.title}</h3>
            )}
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {selectedPost.body || (
                <span className="text-muted-foreground">No caption</span>
              )}
            </p>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Accounts
              </p>
              {selectedPost.targets.length === 0 ? (
                <p className="text-xs text-muted-foreground">No targets</p>
              ) : (
                selectedPost.targets.map((t) => (
                  <div
                    key={t.targetId}
                    className="flex items-center gap-2 rounded-xl bg-muted px-2.5 py-2"
                  >
                    <span
                      className="flex size-7 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: platformBrand(t.platform),
                        color: platformForeground(t.platform),
                      }}
                    >
                      <Icon
                        icon={
                          PLATFORM_META[t.platform]?.icon ?? "hugeicons:link-01"
                        }
                        width={12}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">
                        @{t.username ?? "account"}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {platformLabel(t.platform)}
                      </p>
                      {t.failureMessage && (
                        <p
                          className="mt-1 break-words text-xs text-destructive"
                          role="status"
                        >
                          {t.failureMessage}
                        </p>
                      )}
                      {t.platformPermalink && (
                        <a
                          href={t.platformPermalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-block text-xs text-primary underline"
                        >
                          View published post
                        </a>
                      )}
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {t.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {selectedPost.status !== "publishing" &&
                selectedPost.status !== "archived" &&
                selectedPost.targets.some(
                  (target) => target.status === "failed",
                ) && (
                  <Button disabled={retrying} onClick={() => void onRetry()}>
                    {retrying ? "Retrying…" : "Retry failed"}
                  </Button>
                )}
              {!["publishing", "published", "archived"].includes(
                selectedPost.status,
              ) && (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/posts/new?edit=${selectedPost._id}`)
                  }
                >
                  Edit
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() =>
                  router.push(`/posts/new?from=${selectedPost._id}`)
                }
              >
                Duplicate
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {selectedPost.status !== "publishing" && (
                <Button variant="destructive" onClick={() => void onDelete()}>
                  Delete
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
