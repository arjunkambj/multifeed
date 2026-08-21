import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";

import { landingUseCases } from "@/constants/landing-page";

export function UseCases() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          Built for real workflows
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          One calendar, however you run social.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Keep publishing organized whether you work alone, with a team, or
          across a full client roster.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {landingUseCases.map((item) => (
          <div key={item.audience}>
            <UseCaseCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}

function UseCaseCard({ item }: { item: (typeof landingUseCases)[number] }) {
  return (
    <Card className="h-full flex-row gap-4 p-5 sm:p-6">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-background text-primary">
        <Icon icon={item.icon} width={22} />
      </div>
      <CardContent className="flex flex-col gap-2 p-0">
        <span className="text-sm font-medium uppercase tracking-wide text-primary">
          {item.audience}
        </span>
        <h3 className="text-lg font-semibold sm:text-xl">{item.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      </CardContent>
    </Card>
  );
}
