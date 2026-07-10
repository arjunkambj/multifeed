import Image from "next/image";

import { testimonials } from "@/constants/landing-page";

export function Testimonitals() {
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
          Testimonials
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Teams running social on autopilot
        </h2>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Creators, founders, and agencies who let agents draft — and still
          approve on the calendar.
        </p>
      </div>

      <div className="relative">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div data-gsap-card key={testimonial.name}>
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent to-background" />
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[number];
}) {
  return (
    <div className="marketing-surface flex h-full flex-col gap-3 border border-border/50 bg-surface p-5 sm:p-6">
      <span aria-hidden className="text-4xl leading-none text-accent/80">
        “
      </span>
      <p className="flex-1 text-base leading-relaxed text-foreground sm:text-lg sm:leading-snug">
        {testimonial.quote}
      </p>
      <div className="flex items-center gap-3 border-t border-border/40 pt-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full">
          <Image
            alt={testimonial.name}
            className="object-cover"
            fill
            sizes="40px"
            src={testimonial.avatar}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">{testimonial.name}</span>
          <span className="text-xs text-muted">{testimonial.role}</span>
        </div>
      </div>
    </div>
  );
}
