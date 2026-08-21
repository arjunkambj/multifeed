import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

import { featureItems } from "@/constants/landing-page";

export function Features() {
  const firstRow = featureItems.slice(0, 2);
  const secondRow = featureItems.slice(2);

  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24"
      id="features"
    >
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          Features
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Create once. Tailor every channel.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Move from first draft to scheduled post without copying, pasting, or
          losing track of what goes live next.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {firstRow.map((item) => (
            <div className="h-full" key={item.heading}>
              <FeatureCard item={item} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {secondRow.map((item) => (
            <div className="h-full" key={item.heading}>
              <FeatureCard item={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ item }: { item: (typeof featureItems)[number] }) {
  return (
    <Card className="h-full gap-2 py-0">
      <Image
        alt={item.heading}
        className="h-52 w-full object-cover md:h-56"
        height={224}
        loading="lazy"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        src={item.image}
        width={672}
      />
      <CardContent className="flex flex-col gap-2 pb-5">
        <h3 className="text-lg font-semibold sm:text-xl">{item.heading}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      </CardContent>
    </Card>
  );
}
