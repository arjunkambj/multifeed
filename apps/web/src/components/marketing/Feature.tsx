"use client";

import { ChevronRight } from "@honeyicons/react";
import { easeOut } from "motion";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { featureItems } from "@/constants/landing-page";
import { cn } from "@/lib/utils";
import {
  BODY,
  HEADER_GAP,
  MOCK_CARD,
  OVERLINE,
  PANEL_MEDIA,
  PANEL_PADDING,
  platforms,
  SOFT_CHIP,
} from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

function OverridesMock() {
  const overrides = [
    {
      platform: platforms[2],
      text: "The long-form take, with a link in the first comment.",
    },
    { platform: platforms[0], text: "One sharp line. That's all X needs." },
    {
      platform: platforms[4],
      text: "Same clip. Caption plus a pinned comment.",
    },
  ];
  return (
    <div className={cn(MOCK_CARD, "scale-[0.90]")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm leading-5 font-medium">One draft</p>
        <span className={SOFT_CHIP}>3 versions</span>
      </div>
      <ul className="mt-4 divide-y">
        {overrides.map((override) => (
          <li
            className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
            key={override.platform.label}
          >
            <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background">
              <override.platform.icon
                className="size-3.5"
                style={{ color: override.platform.color }}
              />
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-5 font-medium">
                {override.platform.label}
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                {override.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CalendarMock() {
  const days = [
    {
      day: "Mon",
      posts: [
        { time: "9:00", label: "Launch", platform: platforms[1] },
        { time: "18:00", label: "Clip", platform: platforms[4] },
      ],
    },
    {
      day: "Tue",
      posts: [{ time: "12:30", label: "Note", platform: platforms[0] }],
    },
    { day: "Wed", posts: [] },
  ];
  return (
    <div className={cn(MOCK_CARD, "scale-[0.90]")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm leading-5 font-medium">Week of Mar 10</p>
        <span className={SOFT_CHIP}>Drag to reschedule</span>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {days.map((day) => (
          <div className="min-w-0" key={day.day}>
            <p className={`${OVERLINE} text-muted-foreground`}>{day.day}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {day.posts.length > 0 ? (
                day.posts.map((post) => (
                  <div
                    className="rounded-xl border border-border/60 bg-background px-2.5 py-2"
                    key={post.time}
                  >
                    <p className="flex items-center gap-1.5 text-xs leading-4 whitespace-nowrap text-muted-foreground">
                      <post.platform.icon
                        className="size-3 shrink-0"
                        style={{ color: post.platform.color }}
                      />
                      {post.time}
                    </p>
                    <p className="mt-1 truncate text-sm leading-5 font-medium">
                      {post.label}
                    </p>
                  </div>
                ))
              ) : (
                <div className="flex min-h-[3.25rem] items-center justify-center rounded-xl border border-dashed border-border/60 px-2.5 py-2">
                  <p className="text-xs leading-4 text-muted-foreground">
                    Drop
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormatsMock() {
  const formats = [
    { platform: platforms[1], format: "Reels + carousel" },
    { platform: platforms[5], format: "Shorts" },
    { platform: platforms[3], format: "Text + link" },
  ];
  return (
    <div className={cn(MOCK_CARD, "scale-[0.90]")}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm leading-5 font-medium">What each app gets</p>
        <span className={SOFT_CHIP}>By platform</span>
      </div>
      <ul className="mt-4 divide-y">
        {formats.map((format) => (
          <li
            className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            key={format.format}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background">
              <format.platform.icon
                className="size-4"
                style={{ color: format.platform.color }}
              />
            </span>
            <p className="min-w-0 flex-1 truncate text-sm leading-5 font-medium">
              {format.platform.label}
            </p>
            <span className="shrink-0 rounded-full border border-border/60 px-2.5 py-1 text-sm leading-5 font-medium text-muted-foreground">
              {format.format}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureMock({
  mock,
}: {
  mock: (typeof featureItems)[number]["mock"];
}) {
  if (mock === "overrides") return <OverridesMock />;
  if (mock === "calendar") return <CalendarMock />;
  return <FormatsMock />;
}

function StickyFeatureCard({
  item,
  index,
  total,
}: {
  item: (typeof featureItems)[number];
  index: number;
  total: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1, 0.96],
    { ease: easeOut },
  );
  const overlay = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 0.18],
    { ease: easeOut },
  );

  return (
    <article
      ref={ref}
      className="sticky"
      style={{
        top: `calc(5.75rem + ${index * 1}rem)`,
        zIndex: index + 1,
      }}
    >
      <motion.div
        style={{ scale, transformOrigin: "top center" }}
        className={cn(
          "relative grid transform-gpu items-center overflow-hidden rounded-panel bg-card will-change-transform md:grid-cols-2",
          index < total - 1 && "mb-6 md:mb-8 lg:mb-10",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 flex-col",
            PANEL_PADDING,
            index % 2 === 1 && "md:order-2",
          )}
        >
          <p className={`text-muted-foreground ${OVERLINE}`}>{item.eyebrow}</p>
          <h3 className="font-heading mt-3 text-[1.75rem] leading-[1.12] font-medium tracking-[-0.03em] text-balance md:text-[2rem] md:leading-[1.1]">
            {item.heading}
          </h3>
          <p className={`mt-4 max-w-[54ch] text-muted-foreground ${BODY}`}>
            {item.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 px-6 text-base",
                "[&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5",
              )}
            >
              {item.ctaPrimary}
              <ChevronRight data-icon="inline-end" />
            </Link>
          </div>
        </div>

        <div
          className={cn(
            "relative h-full overflow-hidden bg-muted",
            PANEL_MEDIA,
          )}
        >
          <Image
            src="/hero-main.webp"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />
          <FeatureMock mock={item.mock} />
        </div>

        <motion.div
          aria-hidden
          style={{ opacity: overlay }}
          className="pointer-events-none absolute inset-0 bg-background"
        />
      </motion.div>
    </article>
  );
}

export function Features() {
  return (
    <Section id="features">
      <SectionHeader
        eyebrow="Features"
        title="One draft."
        titleMuted="Change the caption per platform."
      />

      <div className={`${HEADER_GAP} relative`}>
        {featureItems.map((item, index) => (
          <StickyFeatureCard
            index={index}
            item={item}
            key={item.heading}
            total={featureItems.length}
          />
        ))}
      </div>
    </Section>
  );
}
