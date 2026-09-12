import Image from "next/image";
import Reveal from "@/components/motion/Reveal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { landingPeople } from "@/constants/landing-page";
import { cn } from "@/lib/utils";
import {
  BODY,
  GRID_GAP,
  HEADER_GAP,
  MOCK_CARD,
  OVERLINE,
  PANEL_HEADING,
  platforms,
  SOFT_CHIP,
} from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

/** Floating product mocks, one per step — same treatment as the Feature cards'
    "Scheduled" panel, so every media box on the page speaks one language. */
function StepMock({ step }: { step: (typeof steps)[number] }) {
  if (step.kind === "accounts") {
    const accounts = [
      { platform: platforms[1], handle: "@maya.studio" },
      { platform: platforms[2], handle: "Maya Chen" },
      { platform: platforms[4], handle: "@maya.makes" },
    ];
    return (
      <div className={MOCK_CARD}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm leading-5 font-medium">Accounts</p>
          <span className={SOFT_CHIP}>3 connected</span>
        </div>
        <ul className="mt-4 divide-y">
          {accounts.map((account) => (
            <li
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              key={account.handle}
            >
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background">
                <account.platform.icon
                  className="size-4"
                  style={{ color: account.platform.color }}
                />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm leading-5 font-medium">
                  {account.handle}
                </p>
                <p className="text-xs leading-4 text-muted-foreground">
                  {account.platform.label}
                </p>
              </div>
              <span className={SOFT_CHIP}>Live</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (step.kind === "composer") {
    return (
      <div className={MOCK_CARD}>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm leading-5 font-medium">Composer</p>
          <span className={SOFT_CHIP}>Draft</span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="h-2 w-full rounded-full bg-muted" />
          <div className="h-2 w-11/12 rounded-full bg-muted" />
          <div className="h-2 w-7/12 rounded-full bg-muted" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {["LinkedIn · longer", "X · shorter", "TikTok · comment"].map(
            (override) => (
              <span
                className="inline-flex items-center rounded-full border border-border/60 px-2.5 py-1 text-[0.75rem] leading-4 font-medium text-muted-foreground"
                key={override}
              >
                {override}
              </span>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={MOCK_CARD}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm leading-5 font-medium">Scheduled</p>
        <span className={SOFT_CHIP}>Today</span>
      </div>
      <ul className="mt-4 divide-y">
        {[
          {
            time: "9:00 AM",
            caption: "Launch post is ready",
            people: [landingPeople.elena, landingPeople.marcus],
          },
          {
            time: "6:00 PM",
            caption: "15s clip from studio",
            people: [landingPeople.jess],
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
              {post.people.map((person) => (
                <Avatar
                  className="size-7 border-2 border-background sm:size-8"
                  key={person.initials}
                >
                  <AvatarImage alt="" src={person.src} />
                  <AvatarFallback className="text-[0.625rem] font-medium">
                    {person.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Repeats the platform list so one set is always wider than the viewport.
 *  Two of these sit side by side; the CSS loop shifts exactly one set. */
const MARQUEE_COPIES = 4;

function PlatformMarqueeSet({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className="flex shrink-0 items-center gap-3 pr-3"
    >
      {Array.from({ length: MARQUEE_COPIES }, (_, copy) =>
        platforms.map((platform) => (
          <li
            key={`${copy}-${platform.label}`}
            aria-hidden={hidden || copy > 0 || undefined}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-card px-4.5 py-2 text-[0.9375rem] font-medium text-foreground md:px-5 dark:text-zinc-100"
          >
            <platform.icon
              className="size-4 shrink-0"
              style={{ color: platform.color }}
            />
            <span className="whitespace-nowrap">{platform.label}</span>
          </li>
        )),
      )}
    </ul>
  );
}

const steps = [
  {
    title: "Connect your accounts",
    description:
      "Sign in on Instagram, TikTok, and the rest. On their site, not ours.",
    kind: "accounts",
    mediaFirst: true,
    position: "object-[center_30%]",
  },
  {
    title: "Write the post",
    description:
      "Start with one caption. Change the text for any platform that needs it.",
    kind: "composer",
    mediaFirst: false,
    position: "object-[center_60%]",
  },
  {
    title: "Drop it on the calendar",
    description: "Pick a time. We post it, and try again if it fails.",
    kind: "schedule",
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
        eyebrow="How it works"
        title="Three steps."
        titleMuted="Then you're done for the week."
      />

      <Reveal
        y={0}
        className="relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
      >
        <div className="marketing-marquee-track flex w-max hover:[animation-play-state:paused]">
          <PlatformMarqueeSet />
          <PlatformMarqueeSet hidden />
        </div>
      </Reveal>

      <div
        className={cn(
          HEADER_GAP,
          "grid md:grid-cols-3 items-stretch",
          GRID_GAP,
        )}
      >
        {steps.map((step, index) => (
          <Reveal key={step.title} delay={index * 0.12} className="flex">
            <article className="flex h-full w-full flex-col overflow-hidden rounded-panel bg-card">
              {step.mediaFirst ? (
                <div className="relative min-h-[260px] overflow-hidden bg-muted sm:min-h-[300px]">
                  <Image
                    src="/hero-main.webp"
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={cn("h-full w-full object-cover", step.position)}
                  />
                  <StepMock step={step} />
                </div>
              ) : null}

              <div className="flex flex-1 flex-col p-6">
                <p className={`text-muted-foreground ${OVERLINE}`}>
                  Step {index + 1}
                </p>
                <h3 className={cn(PANEL_HEADING, "text-balance", "mt-3")}>
                  {step.title}
                </h3>
                <p className={cn(BODY, "mt-3 text-muted-foreground")}>
                  {step.description}
                </p>
              </div>

              {step.mediaFirst ? null : (
                <div className="relative mt-auto min-h-[260px] overflow-hidden bg-muted sm:min-h-[300px]">
                  <Image
                    src="/hero-main.webp"
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={cn("h-full w-full object-cover", step.position)}
                  />
                  <StepMock step={step} />
                </div>
              )}
            </article>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
