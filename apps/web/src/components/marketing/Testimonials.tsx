import Reveal from "@/components/motion/Reveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { BODY, CARD_PADDING, GRID_GAP, HEADER_GAP } from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

type Testimonial = {
  name: string;
  handle: string;
  text: string;
  highlight: string;
  initials: string;
};

const testimonials: Testimonial[] = [
  {
    name: "Priya Sharma",
    handle: "@priyabuilds",
    text: "MultiFeed replaced five scheduling tools for us. I plan a full week of posts in one sitting and never think about it again.",
    highlight: "a full week of posts in one sitting",
    initials: "PS",
  },
  {
    name: "Marcus Lee",
    handle: "@marcuslee",
    text: "The calendar view is the killer feature. Spotting the empty days before they happen doubled our posting consistency.",
    highlight: "doubled our posting consistency",
    initials: "ML",
  },
  {
    name: "Ana Rodrigues",
    handle: "@anarod",
    text: "Platform-specific captions used to mean copy-paste chaos. Now each channel gets the right message automatically.",
    highlight: "the right message automatically",
    initials: "AR",
  },
  {
    name: "Tom Becker",
    handle: "@tbecker",
    text: "We manage 12 client calendars with a team of three. MultiFeed is the first tool that didn't buckle under that.",
    highlight: "12 client calendars with a team of three",
    initials: "TB",
  },
  {
    name: "Jess Nguyen",
    handle: "@jesswrites",
    text: "Drag to reschedule sounds small until you live in it. Moving a whole campaign is now a ten-second job.",
    highlight: "a ten-second job",
    initials: "JN",
  },
  {
    name: "David Okafor",
    handle: "@dokafor",
    text: "Setup took minutes. Connected all seven channels, scheduled my first post the same hour, and it just shipped.",
    highlight: "scheduled my first post the same hour",
    initials: "DO",
  },
  {
    name: "Sofia Marino",
    handle: "@sofiamarino",
    text: "The native caption overrides are genius. Our LinkedIn voice and our TikTok energy both stay authentic from one draft.",
    highlight: "both stay authentic from one draft",
    initials: "SM",
  },
  {
    name: "Ryan Whitfield",
    handle: "@ryanwhit",
    text: "Client approvals used to live in email threads. Now everyone reviews the same calendar and nothing ships twice.",
    highlight: "nothing ships twice",
    initials: "RW",
  },
  {
    name: "Amara Diallo",
    handle: "@amaracreates",
    text: "I batch-create on Sundays and MultiFeed handles the rest of the week. Best hour of my workflow, every week.",
    highlight: "best hour of my workflow",
    initials: "AD",
  },
] as const;

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <mark
      className="rounded-[0.28em] bg-primary/14 px-[0.24em] py-[0.05em] leading-[1.45] font-medium text-foreground decoration-clone dark:bg-primary/22"
      style={{ boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}
    >
      {children}
    </mark>
  );
}

function Quote({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight || !text.includes(highlight)) return <>&ldquo;{text}&rdquo;</>;
  const idx = text.indexOf(highlight);
  const before = text.slice(0, idx);
  const after = text.slice(idx + highlight.length);
  return (
    <>
      &ldquo;{before}
      <Mark>{highlight}</Mark>
      {after}&rdquo;
    </>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <div className="flex break-inside-avoid flex-col overflow-hidden rounded-card border-0 bg-zinc-100 dark:bg-zinc-800">
      <div className={cn("flex flex-1 flex-col", CARD_PADDING)}>
        <span
          aria-hidden
          className="select-none font-heading text-[42px] font-bold leading-none tracking-[-0.04em] text-primary"
        >
          &ldquo;
        </span>

        <p className={`mt-3 text-foreground ${BODY}`}>
          <Quote text={t.text} highlight={t.highlight} />
        </p>

        <div className="mt-auto pt-4">
          <div className="mt-4 border-t border-foreground/[0.08]" />
          <div className="flex items-center gap-3 pt-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-card text-xs font-semibold text-foreground">
                {t.initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm leading-5 font-semibold text-foreground">
                {t.name}
              </span>
              <span className="mt-0.5 block truncate text-xs leading-4 text-muted-foreground">
                {t.handle}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <Section id="reviews" className="relative">
      <SectionHeader
        eyebrow="Testimonials"
        title="Loved by busy teams."
        titleMuted="Here's what they say."
      />

      {/* Mobile / tablet: masonry columns for tight packing; desktop: three
          columns with the middle offset lower — space only, no color change */}
      {/* Edge gradient like the platform marquee in WhyMultiFeed, rotated
          vertical so the last row of cards dissolves into the next section */}
      <div
        className={cn(
          HEADER_GAP,
          "[mask-image:linear-gradient(to_bottom,black_78%,transparent)]",
        )}
      >
        <div
          className={cn(
            GRID_GAP,
            "columns-1 space-y-3 md:columns-2 md:space-y-4 lg:hidden",
          )}
        >
          {testimonials.map((t, idx) => (
            <Reveal
              key={t.name}
              delay={(idx % 3) * 0.06}
              className="break-inside-avoid"
            >
              <Card t={t} />
            </Reveal>
          ))}
        </div>

        <div
          className={cn(
            GRID_GAP,
            "hidden lg:grid lg:grid-cols-3 lg:items-start",
          )}
        >
          {[
            testimonials.slice(0, 3),
            testimonials.slice(3, 6),
            testimonials.slice(6),
          ].map((col, colIdx) => (
            <div
              key={colIdx}
              className={cn(
                "flex flex-col",
                GRID_GAP,
                colIdx === 1 && "lg:mt-8",
              )}
            >
              {col.map((t, idx) => (
                <Reveal key={t.name} delay={(idx % 3) * 0.06}>
                  <Card t={t} />
                </Reveal>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
