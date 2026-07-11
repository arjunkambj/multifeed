"use client";

import { useCallback, useMemo, useRef, useState } from "react";
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
import {
  Button,
  Card,
  Chip,
  ListBox,
  Select,
  Spinner,
  Tabs,
  toast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
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
  scheduled: "bg-accent/15 text-accent",
  publishing: "bg-warning/15 text-warning",
  published: "bg-success/15 text-success",
  failed: "bg-danger/15 text-danger",
  draft: "bg-default text-muted",
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

  const posts = useQuery(
    api.posts.listInRange,
    range ? { startMs: range.start, endMs: range.end } : "skip",
  );
  const selectedPost = useQuery(
    api.posts.get,
    selectedPostId ? { postId: selectedPostId } : "skip",
  );
  const reschedule = useMutation(api.posts.reschedule);
  const removePost = useMutation(api.posts.remove);

  const platformOptions = useMemo(
    () =>
      [
        ...new Set(
          (posts ?? []).flatMap((post) =>
            post.targets.map((target) => target.platform),
          ),
        ),
      ].sort(),
    [posts],
  );

  const events: EventInput[] = useMemo(() => {
    if (!posts) return [];
    return posts
      .filter(
        (post) =>
          platformFilter === "all" ||
          post.targets.some((target) => target.platform === platformFilter),
      )
      .map((post) => {
        const platforms = [
          ...new Set(post.targets.map((t) => t.platform)),
        ].join(", ");
        const label =
          post.title?.trim() ||
          post.body.trim().slice(0, 48) ||
          "Untitled post";
        return {
          id: post._id,
          title: label,
          start: post.scheduledFor,
          backgroundColor:
            post.calendarColor ??
            platformBrand(post.targets[0]?.platform ?? "x"),
          borderColor: "transparent",
          textColor: "#fff",
          extendedProps: {
            status: post.status,
            platforms,
            body: post.body,
          },
        };
      });
  }, [platformFilter, posts]);

  const onDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({
      start: arg.start.getTime(),
      end: arg.end.getTime(),
    });
    setTitle(arg.view.title);
    setView(arg.view.type as CalendarView);
  }, []);

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
      toast.success("Post rescheduled.", { timeout: 3000 });
    } catch (error) {
      info.revert();
      toast.danger(
        error instanceof Error ? error.message : "Could not reschedule post",
        { timeout: 3000 },
      );
    }
  };

  const onDelete = async () => {
    if (!selectedPostId) return;
    try {
      await removePost({ postId: selectedPostId });
      setSelectedPostId(null);
      toast.success("Post deleted.", { timeout: 3000 });
    } catch (error) {
      toast.danger(
        error instanceof Error ? error.message : "Could not delete post",
        { timeout: 3000 },
      );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <DashboardPageTitle
        title="Calendar"
        description="Month, week, day, and list — drag to reschedule."
        actions={
          <Button
            variant="primary"
            size="sm"
            onPress={() => router.push("/posts/new")}
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
              <Button size="sm" variant="tertiary" onPress={goPrev}>
                <Icon icon="hugeicons:arrow-left-01" width={16} />
              </Button>
              <Button size="sm" variant="tertiary" onPress={goToday}>
                Today
              </Button>
              <Button size="sm" variant="tertiary" onPress={goNext}>
                <Icon icon="hugeicons:arrow-right-01" width={16} />
              </Button>
              <h2 className="ml-2 text-base font-semibold tracking-tight">
                {title || "…"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                aria-label="Filter calendar by platform"
                className="w-40"
                variant="secondary"
                value={platformFilter}
                onChange={(value) => setPlatformFilter(String(value ?? "all"))}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    <ListBox.Item id="all" textValue="All platforms">
                      All platforms
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                    {platformOptions.map((platform) => (
                      <ListBox.Item
                        key={platform}
                        id={platform}
                        textValue={platformLabel(platform)}
                      >
                        {platformLabel(platform)}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
              <Tabs
                selectedKey={view}
                onSelectionChange={(key) => changeView(key as CalendarView)}
              >
                <Tabs.ListContainer>
                  <Tabs.List aria-label="Calendar view">
                    {VIEWS.map((item) => (
                      <Tabs.Tab key={item.id} id={item.id}>
                        <Icon icon={item.icon} width={14} />
                        {item.label}
                        <Tabs.Indicator />
                      </Tabs.Tab>
                    ))}
                  </Tabs.List>
                </Tabs.ListContainer>
              </Tabs>
            </div>
          </div>

          <div className="multifeed-calendar relative min-h-[640px]">
            {posts === undefined && range && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface/60">
                <Spinner />
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
          <Card className="border border-border bg-surface shadow-none xl:sticky xl:top-4 xl:self-start">
            <Card.Header className="pb-2">
              <Card.Title className="text-base">Post details</Card.Title>
              <Card.Description>Review or jump into editing</Card.Description>
            </Card.Header>
            <Card.Content>
              {selectedPost === undefined && (
                <div className="flex justify-center py-10">
                  <Spinner />
                </div>
              )}

              {selectedPost === null && (
                <p className="text-sm text-muted">Post not found.</p>
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
                      <span className="text-xs text-muted">
                        {format(
                          new Date(selectedPost.scheduledFor),
                          "EEE, MMM d · h:mm a",
                        )}
                      </span>
                    )}
                  </div>

                  {selectedPost.title && (
                    <h3 className="text-sm font-semibold">
                      {selectedPost.title}
                    </h3>
                  )}
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedPost.body || (
                      <span className="text-muted">No caption</span>
                    )}
                  </p>

                  <div className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Accounts
                    </p>
                    {selectedPost.targets.length === 0 ? (
                      <p className="text-xs text-muted">No targets</p>
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
                                PLATFORM_META[t.platform]?.icon ??
                                "hugeicons:link-01"
                              }
                              width={12}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">
                              @{t.username ?? "account"}
                            </p>
                            <p className="truncate text-[11px] text-muted">
                              {platformLabel(t.platform)}
                            </p>
                          </div>
                          <Chip size="sm" variant="soft">
                            {t.status}
                          </Chip>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() =>
                        router.push(`/posts/new?edit=${selectedPost._id}`)
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() =>
                        router.push(`/posts/new?from=${selectedPost._id}`)
                      }
                    >
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="tertiary"
                      onPress={() => setSelectedPostId(null)}
                    >
                      Close
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onPress={() => void onDelete()}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </Card.Content>
          </Card>
        )}
      </div>
    </div>
  );
}
