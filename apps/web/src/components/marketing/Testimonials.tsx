import Reveal from "@/components/motion/Reveal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { landingPeople } from "@/constants/landing-page";
import { cn } from "@/lib/utils";
import { BODY, GRID_GAP, HEADER_GAP } from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

const testimonials = [
  {
    person: landingPeople.elena,
    text: "I used to bounce between five apps to schedule a week. Now I sit down once, plan it, and close the laptop.",
    highlight: "sit down once, plan it, and close the laptop",
  },
  {
    person: landingPeople.marcus,
    text: "The calendar made us notice the empty days. We post more because we can see the holes.",
    highlight: "we can see the holes",
  },
  {
    person: landingPeople.ana,
    text: "I used to paste the same caption everywhere, then go back and fix it. LinkedIn and TikTok get different text from the start now.",
    highlight: "different text from the start",
  },
  {
    person: landingPeople.tom,
    text: "We run 12 client calendars with three people. This is the first tool that didn't get messy at that size.",
    highlight: "12 client calendars with three people",
  },
  {
    person: landingPeople.jess,
    text: "Dragging a post to a new day sounds small. Moving a whole campaign takes about ten seconds.",
    highlight: "about ten seconds",
  },
  {
    person: landingPeople.david,
    text: "I connected six accounts, scheduled a post, and it went out that same hour.",
    highlight: "it went out that same hour",
  },
  {
    person: landingPeople.sofia,
    text: "Our LinkedIn posts are longer. TikTok is messier. Both come from the same draft.",
    highlight: "Both come from the same draft",
  },
  {
    person: landingPeople.ryan,
    text: "Approvals used to live in email. Now everyone looks at the same calendar, so we don't post twice.",
    highlight: "we don't post twice",
  },
  {
    person: landingPeople.amara,
    text: "Sundays I batch the week. MultiFeed posts it. That's the job.",
    highlight: "That's the job",
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

function Card({ t }: { t: (typeof testimonials)[number] }) {
  return (
    <div className="flex break-inside-avoid flex-col overflow-hidden rounded-card border-0 bg-card transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-md">
      <div className="flex flex-1 flex-col px-5 py-4">
        <span
          aria-hidden
          className="select-none font-heading text-[32px] font-bold leading-none tracking-[-0.04em] text-primary"
        >
          &ldquo;
        </span>

        <p className={`mt-1.5 text-foreground ${BODY}`}>
          <Quote text={t.text} highlight={t.highlight} />
        </p>

        <div className="mt-auto pt-3">
          <div className="border-t border-foreground/[0.08]" />
          <div className="flex items-center gap-3 pt-3">
            <Avatar className="size-10" size="lg">
              <AvatarImage alt="" src={t.person.src} />
              <AvatarFallback className="bg-card text-xs font-semibold text-foreground">
                {t.person.initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm leading-5 font-semibold text-foreground">
                {t.person.name}
              </span>
              <span className="mt-0.5 block truncate text-xs leading-4 text-muted-foreground">
                {t.person.handle}
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
        title="What people say."
      />

      <div
        className={cn(
          HEADER_GAP,
          "[mask-image:linear-gradient(to_bottom,black_78%,transparent)]",
        )}
      >
        <div
          className={cn(
            GRID_GAP,
            "columns-1 space-y-3 md:columns-2 md:space-y-4 lg:columns-3",
          )}
        >
          {testimonials.map((t, i) => (
            <Reveal
              className={cn(
                "break-inside-avoid",
                // Middle column on the 3-col layout (items 4–6).
                i >= 3 && i < 6 && "lg:translate-y-10",
              )}
              delay={i * 0.05}
              key={t.person.name}
            >
              <Card t={t} />
            </Reveal>
          ))}
        </div>
      </div>
    </Section>
  );
}
