"use client";

import Image from "next/image";

import { brands } from "@/constants/landing-page";

export function MarketingMarquee() {
  return (
    <section
      className="w-full overflow-hidden pb-16 md:pb-20"
      data-gsap-section
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6" data-gsap-heading>
        <p className="mb-8 text-center text-sm font-medium uppercase tracking-wide text-muted">
          Publish automatically to the networks you already use
        </p>
      </div>
      <div
        className="relative mx-auto max-w-4xl overflow-hidden"
        data-gsap-card
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-background to-transparent sm:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-background to-transparent sm:w-24"
        />
        <div className="marketing-marquee-track flex">
          {[...brands, ...brands, ...brands].map(([name, logo], index) => (
            <div
              className="flex shrink-0 items-center gap-4 px-10 sm:px-12"
              key={`${name}-${index}`}
            >
              <div className="relative h-8 w-28 sm:w-32">
                <Image
                  alt={name}
                  className="object-contain opacity-90 grayscale transition-opacity hover:opacity-100 dark:brightness-0 dark:invert"
                  fill
                  sizes="128px"
                  src={logo}
                  unoptimized
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
