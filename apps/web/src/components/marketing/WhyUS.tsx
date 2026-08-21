import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";

import { whyUsPoints } from "@/constants/landing-page";

export function WhyUS() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          Why MultiFeed
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Less time managing posts. More time making them matter.
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Replace scattered drafts, native schedulers, and status messages with
          one clear publishing workflow.
        </p>
      </div>

      <div className="flex w-full flex-col gap-5 md:gap-10 md:pb-16">
        {whyUsPoints.map((point, index) => (
          <div
            className="md:sticky motion-reduce:md:static"
            key={point.title}
            style={{
              top: `calc(6rem + ${index * 1.75}rem)`,
              zIndex: index + 1,
            }}
          >
            <div>
              <WhyUSCard point={point} reversed={index % 2 === 1} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhyUSCard({
  point,
  reversed,
}: {
  point: (typeof whyUsPoints)[number];
  reversed: boolean;
}) {
  return (
    <Card className="w-full flex-col justify-between gap-6 p-5 sm:p-6 md:flex-row md:gap-10 md:p-10">
      <div
        className={`relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-muted md:w-80 lg:w-96 ${
          reversed ? "md:order-2" : ""
        }`}
      >
        <Image
          alt={point.title}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 384px"
          src={point.image}
        />
      </div>
      <CardContent className="flex flex-1 flex-col justify-center gap-3 md:max-w-lg">
        <span className="text-sm font-medium uppercase tracking-wide text-primary">
          {point.subheading}
        </span>
        <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {point.title}
        </h3>
        <p className="leading-relaxed text-muted-foreground">
          {point.description}
        </p>
        <Link
          className={`${buttonVariants({ size: "lg" })} mt-2 w-fit`}
          href="/sign-in"
        >
          {point.cta}
          <Icon icon="mdi:arrow-right" width={16} />
        </Link>
      </CardContent>
    </Card>
  );
}
