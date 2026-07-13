import { Icon } from "@iconify/react";

import { useCases } from "@/constants/landing-page";

export function UseCases() {
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
          Built for real workflows
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          One calendar, however you run social.
        </h2>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Keep publishing organized whether you work alone, with a team, or
          across a full client roster.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {useCases.map((useCase) => (
          <div data-gsap-card key={useCase.audience}>
            <UseCaseCard useCase={useCase} />
          </div>
        ))}
      </div>
    </section>
  );
}

function UseCaseCard({ useCase }: { useCase: (typeof useCases)[number] }) {
  return (
    <div className="marketing-surface flex h-full gap-4 border border-border/50 bg-surface p-5 sm:p-6">
      <div className="marketing-chip flex size-11 shrink-0 items-center justify-center bg-background text-accent">
        <Icon icon={useCase.icon} width={22} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium uppercase tracking-wide text-accent">
          {useCase.audience}
        </span>
        <h3 className="text-lg font-semibold sm:text-xl">{useCase.title}</h3>
        <p className="text-sm leading-relaxed text-muted">
          {useCase.description}
        </p>
      </div>
    </div>
  );
}
