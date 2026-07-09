"use client";

import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import Image from "next/image";

import { testimonials } from "@/constants/landing-page";
import {
  revealCardVariants,
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from "@/components/marketing/motion-variants";

export function Testimonitals() {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24">
      <motion.div
        className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        <motion.span
          className="text-sm font-semibold uppercase tracking-wide text-accent"
          variants={revealItemVariants}
        >
          Testimonials
        </motion.span>
        <motion.h2
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
          variants={revealItemVariants}
        >
          Teams running social on autopilot
        </motion.h2>
        <motion.p
          className="text-base leading-relaxed text-muted sm:text-lg"
          variants={revealItemVariants}
        >
          Creators, founders, and agencies who let agents draft — and still
          approve on the calendar.
        </motion.p>
      </motion.div>

      <div className="relative">
        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
          initial="initial"
          variants={revealContainerVariants}
          viewport={revealViewport}
          whileInView="animate"
        >
          {testimonials.map((testimonial) => (
            <motion.div key={testimonial.name} variants={revealCardVariants}>
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </motion.div>
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
      <Icon icon="mdi:format-quote-open" width={28} className="text-accent/80" />
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
