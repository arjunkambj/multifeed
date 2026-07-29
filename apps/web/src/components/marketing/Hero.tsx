"use client";

import { buttonVariants, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

import Logo from "@/components/layout/Logo";

type MockPost = {
  time: string;
  title: string;
  platform: "instagram" | "linkedin" | "tiktok" | "youtube";
};

type MockDay = {
  day: number;
  muted?: boolean;
  posts?: MockPost[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MOCK_DAYS: MockDay[] = [
  { day: 28, muted: true },
  { day: 29, muted: true },
  { day: 30, muted: true },
  { day: 1 },
  { day: 2 },
  {
    day: 3,
    posts: [
      {
        time: "10:00",
        title: "Summer launch",
        platform: "instagram",
      },
    ],
  },
  { day: 4 },
  { day: 5 },
  {
    day: 6,
    posts: [{ time: "09:30", title: "Founder note", platform: "linkedin" }],
  },
  { day: 7 },
  { day: 8 },
  {
    day: 9,
    posts: [{ time: "18:00", title: "Behind the scenes", platform: "tiktok" }],
  },
  { day: 10 },
  { day: 11 },
  { day: 12 },
  { day: 13 },
  {
    day: 14,
    posts: [
      { time: "12:00", title: "Product walkthrough", platform: "youtube" },
    ],
  },
  { day: 15 },
  { day: 16 },
  { day: 17 },
  { day: 18 },
  { day: 19 },
  {
    day: 20,
    posts: [
      { time: "11:00", title: "Customer story", platform: "instagram" },
      { time: "14:30", title: "Weekly insight", platform: "linkedin" },
    ],
  },
  { day: 21 },
  { day: 22 },
  { day: 23 },
  { day: 24 },
  { day: 25 },
  { day: 26 },
  { day: 27 },
  { day: 28 },
  { day: 29 },
  {
    day: 30,
    posts: [{ time: "16:00", title: "July recap", platform: "instagram" }],
  },
  { day: 31 },
  { day: 1, muted: true },
  { day: 2, muted: true },
  { day: 3, muted: true },
  { day: 4, muted: true },
  { day: 5, muted: true },
  { day: 6, muted: true },
  { day: 7, muted: true },
  { day: 8, muted: true },
];

const PLATFORM_STYLES: Record<
  MockPost["platform"],
  { icon: string; className: string }
> = {
  instagram: {
    icon: "hugeicons:instagram",
    className:
      "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300",
  },
  linkedin: {
    icon: "hugeicons:linkedin-01",
    className:
      "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  },
  tiktok: {
    icon: "hugeicons:tiktok",
    className: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100",
  },
  youtube: {
    icon: "hugeicons:youtube",
    className: "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  },
};

const SIDEBAR_ITEMS = [
  { icon: "hugeicons:dashboard-square-01", label: "Overview" },
  { icon: "hugeicons:add-square", label: "New post" },
  { icon: "hugeicons:calendar-03", label: "Calendar", active: true },
  { icon: "hugeicons:layers-01", label: "All posts" },
  { icon: "hugeicons:connect", label: "Connections" },
];

function CalendarMockup() {
  return (
    <div
      aria-label="MultiFeed visual content calendar preview"
      className="flex h-full min-h-[350px] w-full bg-background text-left text-foreground sm:min-h-[430px] md:min-h-[500px]"
      role="img"
    >
      <aside className="hidden w-36 shrink-0 flex-col border-r border-border/70 bg-surface-secondary/50 p-3 md:flex lg:w-40 lg:p-4">
        <Logo className="mb-7 scale-75 origin-left" />
        <div className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <div
              className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-medium ${
                item.active ? "bg-accent/10 text-accent" : "text-muted"
              }`}
              key={item.label}
            >
              <Icon icon={item.icon} width={13} />
              {item.label}
            </div>
          ))}
        </div>
        <div className="mt-auto space-y-1 border-t border-border/60 pt-3">
          <div className="flex items-center gap-2 px-2.5 py-1.5 text-[10px] text-muted">
            <Icon icon="hugeicons:user-group" width={13} /> Team
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 text-[10px] text-muted">
            <Icon icon="hugeicons:settings-02" width={13} /> Settings
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-surface">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-border/60 px-3 sm:h-12 sm:px-5">
          <Icon
            className="text-muted"
            icon="hugeicons:sidebar-left"
            width={15}
          />
          <div className="flex size-6 items-center justify-center rounded-full bg-accent/15 text-[9px] font-bold text-accent sm:size-7">
            MF
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-5 lg:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight sm:text-lg">
                Calendar
              </h2>
              <p className="mt-0.5 hidden text-[9px] text-muted sm:block sm:text-[10px]">
                Plan, review, and reschedule every post in one place.
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1.5 text-[9px] font-semibold text-accent-foreground sm:px-3 sm:py-2 sm:text-[10px]">
              <Icon icon="hugeicons:add-01" width={12} />
              New post
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <div className="flex size-6 items-center justify-center rounded-md bg-surface-secondary text-muted sm:size-7">
                <Icon icon="hugeicons:arrow-left-01" width={11} />
              </div>
              <div className="rounded-md bg-surface-secondary px-2 py-1.5 text-[9px] font-semibold sm:text-[10px]">
                Today
              </div>
              <div className="flex size-6 items-center justify-center rounded-md bg-surface-secondary text-muted sm:size-7">
                <Icon icon="hugeicons:arrow-right-01" width={11} />
              </div>
              <span className="ml-1 text-[10px] font-bold sm:ml-2 sm:text-xs">
                July 2026
              </span>
            </div>
            <div className="hidden items-center gap-1 sm:flex">
              <div className="flex items-center gap-2 rounded-md bg-surface-secondary px-2.5 py-1.5 text-[9px]">
                All platforms
                <Icon icon="hugeicons:arrow-down-01" width={10} />
              </div>
              <div className="flex rounded-md bg-surface-secondary p-0.5 text-[9px] text-muted">
                <span className="rounded-[5px] bg-surface px-2 py-1 font-semibold text-foreground shadow-sm">
                  Month
                </span>
                <span className="px-2 py-1">Week</span>
                <span className="hidden px-2 py-1 lg:block">List</span>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-[24px_repeat(6,minmax(0,1fr))] overflow-hidden rounded-lg border border-border/80 bg-background">
            {WEEKDAYS.map((weekday) => (
              <div
                className="flex items-center justify-center border-b border-r border-border/70 bg-surface-secondary/70 text-[7px] font-semibold uppercase tracking-wide text-muted last:border-r-0 sm:text-[8px]"
                key={weekday}
              >
                {weekday}
              </div>
            ))}
            {MOCK_DAYS.map((date, index) => (
              <div
                className="min-w-0 overflow-hidden border-b border-r border-border/70 p-1.5 [&:nth-last-child(-n+7)]:border-b-0 [&:nth-child(7n)]:border-r-0 sm:p-2"
                key={`${date.day}-${index}`}
              >
                <div className="mb-1 flex justify-end">
                  <span
                    className={`flex size-3.5 items-center justify-center rounded-full text-[7px] sm:size-4 sm:text-[8px] ${
                      date.day === 29 && !date.muted
                        ? "bg-accent font-semibold text-accent-foreground"
                        : date.muted
                          ? "text-muted/40"
                          : "text-muted"
                    }`}
                  >
                    {date.day}
                  </span>
                </div>
                <div className="space-y-1">
                  {date.posts?.map((post) => {
                    const platform = PLATFORM_STYLES[post.platform];

                    return (
                      <div
                        className={`flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-[6px] font-semibold sm:text-[7px] lg:text-[8px] ${platform.className}`}
                        key={`${post.time}-${post.title}`}
                      >
                        <Icon
                          className="shrink-0"
                          icon={platform.icon}
                          width={9}
                        />
                        <span className="hidden shrink-0 lg:inline">
                          {post.time}
                        </span>
                        <span className="truncate">{post.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section
      className="relative mx-auto flex min-h-[58dvh] w-full max-w-7xl flex-col gap-12 px-4 pb-16 pt-20 sm:px-6 sm:pt-24 md:gap-14 md:pb-20 lg:pt-36"
      id="hero"
    >
      <div
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 text-center lg:mt-4"
        data-gsap-hero-copy
      >
        <div>
          <Chip className="marketing-chip border border-border/60 bg-surface px-3 py-1 text-accent">
            7 social platforms · 1 visual calendar
          </Chip>
        </div>

        <h1 className="font-display max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.05]">
          Plan once. Show up{" "}
          <span className="relative inline-block whitespace-nowrap">
            everywhere.
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-1 h-[0.18em] rounded-full bg-accent sm:-bottom-1.5"
              data-gsap-underline
            />
          </span>
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Create, tailor, and schedule posts for Instagram, TikTok, YouTube,
          LinkedIn, X, Facebook, and Threads—without juggling seven different
          tools.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            className={`${buttonVariants({ size: "lg" })} button`}
            href="/sign-in"
          >
            Plan your first post
          </Link>
          <Link
            className={`${buttonVariants({ size: "lg", variant: "tertiary" })} button`}
            href="#pricing"
          >
            Compare plans
          </Link>
        </div>

        <p className="max-w-xl text-sm leading-relaxed text-muted">
          Review every caption, format, and publish time before it goes live.
        </p>
      </div>

      <div
        className="relative z-10 mx-auto w-full max-w-5xl"
        data-gsap-hero-visual
      >
        <div className="marketing-surface overflow-hidden border border-border/60 bg-surface shadow-xl shadow-foreground/5 dark:shadow-black/30">
          {/* Window chrome */}
          <div className="flex h-11 items-center gap-3 border-b border-border/50 bg-surface-secondary/50 px-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#FF5F57]" />
              <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="size-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="mx-auto flex h-7 max-w-xs flex-1 items-center justify-center rounded-lg border border-border/40 bg-background px-3">
              <span className="truncate text-[11px] font-medium text-muted">
                app.multifeed.io
              </span>
            </div>
            <div className="hidden w-14 sm:block" />
          </div>

          <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-secondary/40">
            <CalendarMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
