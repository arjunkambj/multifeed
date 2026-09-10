"use client";

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
import { ButtonGroup } from "@/components/ui/button-group";
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
import { platformBrand, platformForeground } from "@/lib/platform-meta";
import { cn } from "@/lib/utils";
import { MOCK_FRAME } from "./rhythm";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const views = [
  { id: "dayGridMonth", label: "Month", icon: "hugeicons:calendar-03" },
  { id: "timeGridWeek", label: "Week", icon: "hugeicons:calendar-02" },
] as const;

const MOCK_EVENTS = [
  { date: "2026-12-03", title: "X note", platform: "x" },
  { date: "2026-12-06", title: "Reel cut", platform: "instagram" },
  { date: "2026-12-10", title: "One sharp line", platform: "x" },
  { date: "2026-12-11", title: "Launch post", platform: "instagram" },
  { date: "2026-12-11", title: "Studio clip", platform: "tiktok" },
  { date: "2026-12-12", title: "LinkedIn take", platform: "linkedin" },
  { date: "2026-12-13", title: "Studio stills", platform: "instagram" },
  { date: "2026-12-13", title: "Friday recap", platform: "facebook" },
  { date: "2026-12-14", title: "Shorts", platform: "youtube" },
  { date: "2026-12-18", title: "Q&A clip", platform: "tiktok" },
  { date: "2026-12-20", title: "Behind the scenes", platform: "instagram" },
  { date: "2026-12-25", title: "Weekly roundup", platform: "linkedin" },
] as const;

const MOCK_DAYS = [
  { date: "2026-11-29", day: 29, other: true, today: false },
  { date: "2026-11-30", day: 30, other: true, today: false },
  ...Array.from({ length: 31 }, (_, index) => ({
    date: `2026-12-${String(index + 1).padStart(2, "0")}`,
    day: index + 1,
    other: false,
    today: index + 1 === 11,
  })),
  ...Array.from({ length: 2 }, (_, index) => ({
    date: `2027-01-${String(index + 1).padStart(2, "0")}`,
    day: index + 1,
    other: true,
    today: false,
  })),
];

function MockMonthGrid() {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <div className="grid shrink-0 grid-cols-7 rounded-t-2xl border-4 border-b-0 border-card bg-card">
        {WEEKDAYS.map((weekday) => (
          <div
            className="relative py-2 text-center text-xs font-semibold tracking-[0.04em] text-muted-foreground uppercase after:absolute after:inset-y-1.5 after:right-0 after:w-px after:bg-border last:after:hidden"
            key={weekday}
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid min-h-0 flex-[5] grid-cols-7 grid-rows-5 overflow-hidden rounded-b-2xl border-4 border-t-0 border-card bg-background">
          {MOCK_DAYS.map((cell, index) => {
            const events = MOCK_EVENTS.filter((event) => event.date === cell.date);
            const lastCol = index % 7 === 6;
            const lastRow = index >= MOCK_DAYS.length - 7;
            return (
              <div
                className={cn(
                  "relative flex min-h-0 flex-col overflow-hidden px-1.5 pt-1.5 pb-1",
                  !lastCol && "border-r border-border",
                  !lastRow && "border-b border-border",
                  cell.today && "bg-primary/8",
                )}
                key={cell.date}
              >
                {cell.other ? (
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(-45deg,transparent_0_6px,var(--border)_6px_7px)]"
                  />
                ) : null}
                {cell.today ? (
                  <span className="relative inline-flex size-[1.6rem] items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {cell.day}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "relative px-1 text-xs font-semibold",
                      cell.other
                        ? "font-medium text-muted-foreground"
                        : "text-foreground",
                    )}
                  >
                    {cell.day}
                  </span>
                )}
                <div className="relative mt-1 flex min-h-0 flex-col gap-px">
                  {events.map((event) => (
                    <span
                      className="truncate rounded-lg px-1.5 py-0.5 text-[0.7rem] font-semibold"
                      key={event.title}
                      style={{
                        backgroundColor: platformBrand(event.platform),
                        color: platformForeground(event.platform),
                      }}
                    >
                      {event.title}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div aria-hidden className="flex-1" />
      </div>
    </div>
  );
}

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
              <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4">
                <Button size="icon-sm" tabIndex={-1} variant="ghost">
                  <HugeiconsIcon icon={SidebarLeftIcon} strokeWidth={2} />
                </Button>
                <div className="ml-auto">
                  <Avatar className="size-8">
                    <AvatarImage alt="" src={landingPeople.elena.src} />
                    <AvatarFallback className="text-xs font-medium">
                      {landingPeople.elena.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </header>

              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-3">
                <DashboardPageTitle
                  title="Calendar"
                  actions={
                    <Button tabIndex={-1}>
                      <Icon icon="hugeicons:add-01" width={16} />
                      New post
                    </Button>
                  }
                />

                <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ButtonGroup
                      aria-hidden
                      className="rounded-xl bg-secondary"
                    >
                      <Button size="icon" tabIndex={-1} variant="outline">
                        <Icon icon="hugeicons:arrow-left-01" width={16} />
                      </Button>
                      <Button tabIndex={-1} variant="outline">
                        Today
                      </Button>
                      <Button size="icon" tabIndex={-1} variant="outline">
                        <Icon icon="hugeicons:arrow-right-01" width={16} />
                      </Button>
                    </ButtonGroup>
                    <h2 className="text-base font-semibold tracking-tight">
                      December 2026
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

                <MockMonthGrid />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
