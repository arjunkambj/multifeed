"use client";

import type { EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import {
  SearchIcon,
  SidebarLeftIcon,
  UnfoldMoreIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Icon } from "@iconify/react";
import { useLayoutEffect, useRef, useState } from "react";
import { DashboardPageTitle } from "@/components/layout/DashboardPageTitle";
import Logo from "@/components/layout/Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { landingPeople } from "@/constants/landing-page";
import {
  type MenuItem,
  sidebarCategories,
  sidebarFooterItems,
  sidebarMainItems,
} from "@/constants/sidebar-menu";
import { platformBrand } from "@/lib/platform-meta";
import { cn } from "@/lib/utils";
import { MOCK_FRAME } from "./rhythm";

const MOCK_NOW = "2026-03-11";

const views = [
  { id: "dayGridMonth", label: "Month", icon: "hugeicons:calendar-03" },
  { id: "timeGridWeek", label: "Week", icon: "hugeicons:calendar-02" },
  { id: "timeGridDay", label: "Day", icon: "hugeicons:calendar-01" },
  { id: "listWeek", label: "List", icon: "hugeicons:menu-01" },
] as const;

const events: EventInput[] = [
  {
    title: "X note",
    start: "2026-03-03T12:30:00",
    backgroundColor: platformBrand("x"),
  },
  {
    title: "Reel cut",
    start: "2026-03-06T16:00:00",
    backgroundColor: platformBrand("instagram"),
  },
  {
    title: "One sharp line",
    start: "2026-03-10T12:30:00",
    backgroundColor: platformBrand("x"),
  },
  {
    title: "Launch post",
    start: "2026-03-11T09:00:00",
    backgroundColor: platformBrand("instagram"),
  },
  {
    title: "Studio clip",
    start: "2026-03-11T18:00:00",
    backgroundColor: platformBrand("tiktok"),
  },
  {
    title: "LinkedIn take",
    start: "2026-03-12T08:00:00",
    backgroundColor: platformBrand("linkedin"),
  },
  {
    title: "Studio stills",
    start: "2026-03-13T11:00:00",
    backgroundColor: platformBrand("instagram"),
  },
  {
    title: "Friday recap",
    start: "2026-03-13T17:00:00",
    backgroundColor: platformBrand("facebook"),
  },
  {
    title: "Shorts",
    start: "2026-03-14T16:00:00",
    backgroundColor: platformBrand("youtube"),
  },
  {
    title: "Q&A clip",
    start: "2026-03-18T10:00:00",
    backgroundColor: platformBrand("tiktok"),
  },
  {
    title: "Behind the scenes",
    start: "2026-03-20T14:00:00",
    backgroundColor: platformBrand("instagram"),
  },
  {
    title: "Weekly roundup",
    start: "2026-03-25T09:00:00",
    backgroundColor: platformBrand("linkedin"),
  },
].map((event) => ({
  ...event,
  display: "block",
  borderColor: "transparent",
  textColor: "#fff",
}));

function MockNavItem({
  item,
  active = false,
}: {
  item: MenuItem;
  active?: boolean;
}) {
  return (
    <li>
      <span
        className={cn(
          "flex h-8 w-full items-center gap-2 overflow-hidden rounded-lg px-2 py-2 text-left text-sm whitespace-nowrap",
          active
            ? "bg-card font-medium text-card-foreground"
            : "text-sidebar-foreground",
        )}
      >
        <HugeiconsIcon className="size-4" icon={item.icon} strokeWidth={2} />
        <span className="truncate">{item.name}</span>
      </span>
    </li>
  );
}

function MockNavList({
  items,
  activeName,
}: {
  items: MenuItem[];
  activeName?: string;
}) {
  return (
    <ul className="flex w-full min-w-0 flex-col gap-1">
      {items.map((item) => (
        <MockNavItem
          active={item.name === activeName}
          item={item}
          key={item.name}
        />
      ))}
    </ul>
  );
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 800;

/**
 * Desktop calendar chrome for the marketing page. Drawn at 1280×800 and
 * scaled to the hero frame so labels, tabs, and the month grid stay intact.
 */
export function DashboardMock() {
  const frameRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const update = () => {
      const width = frame.clientWidth;
      if (width === 0) return;
      setScale(width / STAGE_WIDTH);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    if (scale == null) return;
    try {
      calendarRef.current?.getApi().updateSize();
    } catch {
      /* FullCalendar isn't mounted yet */
    }
  }, [scale]);

  return (
    <div
      ref={frameRef}
      className={cn(MOCK_FRAME, "w-full overflow-hidden")}
      inert
    >
      <div
        className="relative w-full"
        style={{ aspectRatio: `${STAGE_WIDTH} / ${STAGE_HEIGHT}` }}
      >
        {scale != null ? (
          <div
            className="absolute top-0 left-0 flex bg-background"
            style={{
              width: STAGE_WIDTH,
              height: STAGE_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar">
              <div className="flex flex-col gap-2 px-2 pt-2 pb-1">
                <span className="flex items-center px-1 py-1">
                  <Logo markOnly markClassName="size-7" />
                </span>
                <InputGroup className="h-8 w-full min-w-0">
                  <InputGroupAddon>
                    <HugeiconsIcon icon={SearchIcon} strokeWidth={2} />
                  </InputGroupAddon>
                  <InputGroupInput
                    readOnly
                    tabIndex={-1}
                    placeholder="Search"
                  />
                  <InputGroupAddon align="inline-end" className="shrink-0">
                    <Kbd>⌘K</Kbd>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div className="flex min-h-0 flex-1 flex-col pt-1">
                <div className="px-2">
                  <MockNavList items={sidebarMainItems} />
                </div>
                {sidebarCategories.map((category) => (
                  <div className="mt-4 px-2" key={category.name}>
                    <p className="px-2 pb-1 text-xs font-medium text-sidebar-foreground/70">
                      {category.name}
                    </p>
                    <MockNavList activeName="Calendar" items={category.items} />
                  </div>
                ))}
              </div>

              <div className="px-2 pt-4 pb-2">
                <MockNavList items={sidebarFooterItems} />
              </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-6">
                <Button size="icon-sm" tabIndex={-1} variant="ghost">
                  <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} />
                </Button>
                <div className="ml-auto">
                  <Avatar className="size-8">
                    <AvatarImage alt="" src={landingPeople.maya.src} />
                    <AvatarFallback className="text-xs font-medium">
                      {landingPeople.maya.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </header>

              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 py-3">
                <DashboardPageTitle
                  title="Calendar"
                  description="Month, week, day, and list. Drag a post to move it."
                  actions={
                    <Button tabIndex={-1}>
                      <Icon icon="hugeicons:add-01" width={16} />
                      New post
                    </Button>
                  }
                />

                <div className="flex shrink-0 items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    <Button tabIndex={-1} variant="outline">
                      <Icon icon="hugeicons:arrow-left-01" width={16} />
                    </Button>
                    <Button tabIndex={-1} variant="outline">
                      Today
                    </Button>
                    <Button tabIndex={-1} variant="outline">
                      <Icon icon="hugeicons:arrow-right-01" width={16} />
                    </Button>
                    <h2 className="ml-2 text-base font-semibold tracking-tight">
                      March 2026
                    </h2>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="flex h-8 w-40 items-center justify-between gap-1.5 rounded-2xl bg-input px-3 text-sm">
                      All platforms
                      <HugeiconsIcon
                        className="size-4 text-muted-foreground"
                        icon={UnfoldMoreIcon}
                        strokeWidth={2}
                      />
                    </span>
                    <Tabs defaultValue="dayGridMonth">
                      <TabsList aria-hidden>
                        {views.map((item) => (
                          <TabsTrigger key={item.id} value={item.id}>
                            <Icon icon={item.icon} width={14} />
                            {item.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </Tabs>
                  </div>
                </div>

                <div className="multifeed-calendar marketing-calendar min-h-0 flex-1 overflow-hidden rounded-2xl border border-card bg-background">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin]}
                    initialView="dayGridMonth"
                    initialDate={MOCK_NOW}
                    now={MOCK_NOW}
                    headerToolbar={false}
                    height="100%"
                    expandRows
                    events={events}
                    editable={false}
                    selectable={false}
                    weekends
                    fixedWeekCount
                    dayMaxEvents={3}
                    displayEventTime={false}
                    eventClassNames="multifeed-cal-event"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
