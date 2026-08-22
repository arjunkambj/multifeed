"use client";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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

import { featureItems } from "@/constants/landing-page";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BODY,
  HEADER_GAP,
  OVERLINE,
  PANEL_MEDIA,
  PANEL_PADDING,
  SOFT_CHIP,
} from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

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
    reduceMotion ? [1, 1] : [1, 0.94],
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
          "relative grid items-center overflow-hidden rounded-panel bg-zinc-100 md:grid-cols-2 dark:bg-zinc-800",
          index < total - 1 && "mb-6 md:mb-10 lg:mb-14",
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
                buttonVariants(),
                "[&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5",
              )}
            >
              {item.ctaPrimary}
              <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
            </Link>
          </div>
        </div>

        <div
          className={cn("relative h-full overflow-hidden bg-muted", PANEL_MEDIA)}
        >
          <Image
            src="/hero-main.png"
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
          />
          {/* Floating mock "Scheduled" card, like the Post Bridge reference */}
          <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 scale-[0.90] rounded-card border bg-card p-4 shadow-2xl shadow-black/10 sm:inset-x-8 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm leading-5 font-medium">Scheduled</p>
              <span className={SOFT_CHIP}>Today</span>
            </div>

            <ul className="mt-4 divide-y">
              {[
                {
                  time: "9:00 AM",
                  caption: "Launch post is ready to go",
                  people: ["PS", "ML"],
                },
                {
                  time: "12:30 PM",
                  caption: "Founder note in the replies",
                  people: ["AR", "TB"],
                },
                {
                  time: "6:00 PM",
                  caption: "15s product clip from studio",
                  people: ["JN", "DO"],
                },
              ].map((post) => (
                <li
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  key={post.time}
                >
                  <div className="min-w-0">
                    <p className="text-xs leading-4 text-muted-foreground">
                      {post.time}
                    </p>
                    <p className="mt-1 truncate text-sm leading-5 font-medium">
                      {post.caption}
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {post.people.map((initials) => (
                      <Avatar
                        className="size-7 border-2 border-background sm:size-8"
                        key={initials}
                      >
                        <AvatarFallback className="text-[0.625rem] font-medium">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
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
        eyebrow="Why MultiFeed"
        title="Posting shouldn't take an hour."
        titleMuted="With us it takes 30 seconds."
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
