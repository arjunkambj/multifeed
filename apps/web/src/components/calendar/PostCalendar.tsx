"use client";

import { useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  DateSelectArg,
  EventInput,
} from "@fullcalendar/core";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache/hooks";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import { CalendarGridSkeleton } from "@/components/layout/CalendarGridSkeleton";
import {
  PLATFORM_META,
  platformBrand,
  platformLabel,
} from "@/lib/platform-meta";

type CalendarView =
  | "dayGridMonth"
  | "timeGridWeek"
  | "timeGridDay"
  | "listWeek";

const VIEWS: { id: CalendarView; label: string; icon: string }[] = [
  { id: "dayGridMonth", label: "Month", icon: "hugeicons:calendar-03" },
  { id: "timeGridWeek", label: "Week", icon: "hugeicons:calendar-02" },
  { id: "timeGridDay", label: "Day", icon: "hugeicons:calendar-01" },
  { id: "listWeek", label: "List", icon: "hugeicons:menu-01" },
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
  const [range, setRange] = useState<{ start: number; end: number } | null>(
    null,
  );
  const [selectedPostId, setSelectedPostId] = useState<Id<"posts"> | null>(
    (highlight as Id<"posts">) || null,
  );
  const [title, setTitle] = useState("");

  const postsResult = useQuery(
    api.posts.listInRange,
    range ? { startMs: range.start, endMs: range.end } : "skip",
  );
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

  const events: EventInput[] = (() => {
    if (!posts) return [];
    return posts.reduce<EventInput[]>((acc, post) => {
      if (
        platformFilter === "all" ||
        post.targets.some((target) => target.platform === platformFilter)
      ) {
        const platforms = [
          ...new Set(post.targets.map((t) => t.platform)),
        ].join(", ");
        const label =
          post.title?.trim() ||
          post.body.trim().slice(0, 48) ||
          "Untitled post";
        acc.push({
          id: post._id,
          title: label,
          start: post.scheduledFor,
          backgroundColor:
            post.calendarColor ??
            platformBrand(post.targets[0]?.platform ?? "x"),
          borderColor: "transparent",
          textColor: "#fff",
          editable: post.status === "scheduled" || post.status === "failed",
          extendedProps: {
            status: post.status,
            platforms,
            body: post.body,
          },
        });
      }
      return acc;
    }, []);
  })();

  const onDatesSet = (arg: DatesSetArg) => {
    setRange({
      start: arg.start.getTime(),
      end: arg.end.getTime(),
    });
    setTitle(arg.view.title);
    setView(arg.view.type as CalendarView);
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
      toast.error(error instanceof Error ? error.message : "Could not reschedule post");
    }
  };

  const onDelete = async () => {
    if (!selectedPostId) return;
    try {
      await removePost({ postId: selectedPostId });
      setSelectedPostId(null);
      toast.success("Post deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete post");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageTitle
        title="Calendar"
        description="Month, week, day, and list — drag to reschedule."
        actions={
          <Button
            size="sm"
            onClick={() => router.push("/posts/new")}
          >
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
        <div className="flex min-w-0 flex-col gap-4 overflow-hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={goPrev}>
                <Icon icon="hugeicons:arrow-left-01" width={16} />
              </Button>
              <Button size="sm" variant="outline" onClick={goToday}>
                Today
              </Button>
              <Button size="sm" variant="outline" onClick={goNext}>
                <Icon icon="hugeicons:arrow-right-01" width={16} />
              </Button>
              <h2 className="ml-2 text-base font-semibold tracking-tight">
                {title || "…"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={platformFilter}
                onValueChange={(value) => setPlatformFilter(String(value ?? "all"))}
              >
                <SelectTrigger aria-label="Filter calendar by platform" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All platforms</SelectItem>
                  {platformOptions.map((platform) => (
                    <SelectItem key={platform} value={platform}>
                      {platformLabel(platform)}
                    </SelectItem>
                  ))}
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

          <div className="multifeed-calendar relative min-h-[640px]">
            {posts === undefined && range && (
              <div className="absolute inset-0 z-10 bg-card">
                <CalendarGridSkeleton />
              </div>
            )}
            <FullCalendar
              ref={calendarRef}
              plugins={[
                dayGridPlugin,
                timeGridPlugin,
                listPlugin,
                interactionPlugin,
              ]}
              initialView="dayGridMonth"
              headerToolbar={false}
              height={640}
              events={events}
              editable
              selectable
              selectMirror
              dayMaxEvents={3}
              nowIndicator
              weekends
              datesSet={onDatesSet}
              eventClick={onEventClick}
              select={onSelect}
              eventDrop={(info) => void onEventDrop(info)}
              eventClassNames="multifeed-cal-event"
              views={{
                dayGridMonth: { dayMaxEventRows: 3 },
                timeGridWeek: {
                  slotMinTime: "06:00:00",
                  slotMaxTime: "24:00:00",
                },
                timeGridDay: {
                  slotMinTime: "06:00:00",
                  slotMaxTime: "24:00:00",
                },
                listWeek: {
                  listDayFormat: {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  },
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
  return (
    <Card className="border border-border bg-card shadow-none xl:sticky xl:top-4 xl:self-start">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Post details</CardTitle>
        <CardDescription>Review or jump into editing</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedPost === undefined && (
          <div className="space-y-4 py-2">
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
                    className="flex items-center gap-2 rounded-xl border border-border/60 px-2.5 py-2"
                  >
                    <span
                      className="flex size-7 items-center justify-center rounded-full text-white"
                      style={{
                        backgroundColor: platformBrand(t.platform),
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
                    </div>
                    <Badge variant="secondary">

                      </Badge>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {!["publishing", "published", "archived"].includes(
                selectedPost.status,
              ) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(`/posts/new?edit=${selectedPost._id}`)
                  }
                >
                  Edit
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(`/posts/new?from=${selectedPost._id}`)
                }
              >
                Duplicate
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
              {selectedPost.status !== "publishing" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void onDelete()}
                >
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
