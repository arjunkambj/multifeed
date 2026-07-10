"use client";

const steps = [
  {
    description:
      "Link 30+ networks and plug in the agents you already use — Claude, ChatGPT, Codex, Cursor, and more.",
    step: "1",
    title: "Connect networks & agents",
  },
  {
    description:
      "Agents plan and generate posts. Everything lands on a visual calendar ready for you to tweak.",
    step: "2",
    title: "Generate on autopilot",
  },
  {
    description:
      "Review, edit, and approve — then Multi Feed schedules and publishes across every connected network.",
    step: "3",
    title: "Approve & publish",
  },
] as const;

export function HowItWorks() {
  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24"
      data-gsap-section
    >
      <div
        className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center"
        data-gsap-heading
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-accent">
          How it works
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Three steps to social autopilot
        </h2>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          From empty calendar to multi-network schedule — with AI doing the
          heavy lifting.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {steps.map((step) => (
          <div data-gsap-card key={step.step}>
            <StepCard
              description={step.description}
              step={step.step}
              title={step.title}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function StepCard({
  title,
  description,
  step,
}: {
  title: string;
  description: string;
  step: string;
}) {
  return (
    <div className="marketing-surface flex h-full w-full flex-col gap-5 border border-border/50 bg-surface p-2">
      <div className="marketing-media flex h-56 w-full items-end bg-background p-5 sm:h-64">
        <div className="grid w-full grid-cols-4 gap-2">
          {[32, 58, 76, 44].map((height, index) => (
            <div
              className="flex h-32 items-end rounded-full bg-surface-secondary sm:h-36"
              key={`${height}-${index}`}
            >
              <div
                className="w-full rounded-full bg-accent"
                data-gsap-bar
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2 px-3 pb-5">
        <div className="marketing-chip mr-auto bg-background px-3 py-0.5 text-sm font-semibold">
          Step {step}
        </div>
        <h3 className="text-xl font-medium">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}
