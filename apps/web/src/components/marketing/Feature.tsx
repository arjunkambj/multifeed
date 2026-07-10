"use client";

import Image from "next/image";

import { featureItems } from "@/constants/landing-page";

export function Features() {
  const firstRow = featureItems.slice(0, 2);
  const secondRow = featureItems.slice(2);

  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24"
      data-gsap-section
      id="features"
    >
      <div
        className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center"
        data-gsap-heading
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-accent">
          Features
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Agents plan. You approve. Networks publish.
        </h2>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Autopilot for generation and scheduling — with a visual calendar so
          nothing ships without your eyes on it.
        </p>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {firstRow.map((item) => (
            <div className="h-full" data-gsap-card key={item.heading}>
              <FeatureCard item={item} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {secondRow.map((item) => (
            <div className="h-full" data-gsap-card key={item.heading}>
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
    <div className="marketing-surface flex h-full flex-col overflow-hidden border border-border/50 bg-surface">
      <div
        className="relative h-52 w-full scale-[1.06] md:h-56"
        data-gsap-depth
      >
        <Image
          alt={item.heading}
          className="object-cover"
          fill
          loading="lazy"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          src={item.image}
        />
      </div>
      <div className="flex flex-col gap-2 p-5 sm:p-6">
        <h3 className="text-lg font-semibold sm:text-xl">{item.heading}</h3>
        <p className="text-sm leading-relaxed text-muted">{item.description}</p>
      </div>
    </div>
  );
}
