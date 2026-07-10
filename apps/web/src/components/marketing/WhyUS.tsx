"use client";

import { buttonVariants } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";

import { whyUsPoints } from "@/constants/landing-page";

export function WhyUS() {
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
          Why unifeed
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Social on autopilot — without losing control
        </h2>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          AI agents generate. unifeed schedules across 30+ networks. You review
          everything on one calendar.
        </p>
      </div>

      <div className="flex w-full flex-col gap-5 md:gap-10 md:pb-16">
        {whyUsPoints.map((point, index) => (
          <div
            className="md:sticky motion-reduce:md:static"
            data-gsap-stack-card
            key={point.title}
            style={{
              top: `calc(6rem + ${index * 1.75}rem)`,
              zIndex: index + 1,
            }}
          >
            <div data-gsap-card>
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
    <div
      className="marketing-surface flex w-full flex-col justify-between gap-6 overflow-hidden border border-border/50 bg-surface p-5 sm:p-6 md:flex-row md:gap-10 md:p-10"
      data-gsap-stack-surface
    >
      <div
        className={`marketing-media relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden bg-surface-secondary md:w-80 lg:w-96 ${
          reversed ? "md:order-2" : ""
        }`}
        data-gsap-depth
      >
        <Image
          alt={point.title}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 384px"
          src={point.image}
        />
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3 md:max-w-lg">
        <span className="text-sm font-medium uppercase tracking-wide text-accent">
          {point.subheading}
        </span>
        <h3 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {point.title}
        </h3>
        <p className="leading-relaxed text-muted">{point.description}</p>
        <Link
          className={`${buttonVariants({ size: "lg" })} button mt-2 w-fit`}
          href="/sign-in"
        >
          {point.cta}
          <Icon icon="mdi:arrow-right" />
        </Link>
      </div>
    </div>
  );
}
