import Image from "next/image";
import { Icon } from "@iconify/react";

import Reveal from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import { BODY, GRID_GAP, HEADER_GAP, PANEL_HEADING, platforms } from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

const steps = [
  {
    title: "Connect your channels",
    description:
      "One OAuth click links Instagram, TikTok, YouTube, LinkedIn, X, Facebook, and Threads. No passwords shared with us.",
    mediaFirst: true,
    position: "object-[center_30%]",
  },
  {
    title: "Draft once, tailor everywhere",
    description:
      "Start from one caption, then tune the copy and format per platform without rebuilding the post.",
    mediaFirst: false,
    position: "object-[center_60%]",
  },
  {
    title: "Ship on schedule",
    description:
      "Drag posts onto the calendar and MultiFeed publishes at the right time on every channel, even while you sleep.",
    mediaFirst: true,
    position: "object-center",
  },
] as const;

/**
 * Three numbered how-it-works cards. Outer cards lead with media, the middle
 * one leads with copy, so the row reads as an alternating rhythm.
 */
export function WhyMultiFeed() {
  return (
    <Section id="why-multifeed">
      <SectionHeader
        eyebrow="Why MultiFeed"
        title="From blank page to published"
        titleMuted="in three steps."
      />

      {/* Marquee of supported-platform pills */}
      <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="marketing-marquee-track flex w-max items-center">
          {[...platforms, ...platforms].map((platform, index) => (
            <li
              // Duplicated for a seamless loop; the index keeps keys unique.
              key={`${platform.label}-${index}`}
              aria-hidden={index >= platforms.length}
              className="mr-3 inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-zinc-100 px-4.5 py-2.5 text-[0.9375rem] font-medium text-foreground md:px-5 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <Icon
                icon={platform.icon}
                className="size-4 shrink-0"
                style={{ color: platform.color }}
              />
              <span className="whitespace-nowrap">{platform.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <Reveal
        className={cn(
          HEADER_GAP,
          "grid md:grid-cols-3 items-stretch",
          GRID_GAP,
        )}
      >
        {steps.map((step) => (
          <article
            key={step.title}
            className="flex flex-col overflow-hidden rounded-panel bg-zinc-100 dark:bg-zinc-800"
          >
            {step.mediaFirst ? (
              <div className="relative min-h-[260px] overflow-hidden bg-muted sm:min-h-[300px]">
                <Image
                  src="/hero-main.png"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={cn("h-full w-full object-cover", step.position)}
                />
              </div>
            ) : null}

            <div className="flex flex-1 flex-col p-6">
              <h3
                className={cn(
                  PANEL_HEADING,
                  "text-balance",
                  step.mediaFirst ? "mt-4" : "mt-0",
                )}
              >
                {step.title}
              </h3>
              <p className={cn(BODY, "mt-3 text-muted-foreground")}>
                {step.description}
              </p>
            </div>

            {step.mediaFirst ? null : (
              <div className="relative mt-auto min-h-[260px] overflow-hidden bg-muted sm:min-h-[300px]">
                <Image
                  src="/hero-main.png"
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className={cn("h-full w-full object-cover", step.position)}
                />
              </div>
            )}
          </article>
        ))}
      </Reveal>
    </Section>
  );
}
