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
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-24">
      <motion.div
        className="flex flex-col items-center gap-2 text-center"
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
          className="text-4xl font-bold leading-tight"
          variants={revealItemVariants}
        >
          Hear from creator teams
        </motion.h2>
        <motion.span
          className="text-lg leading-relaxed text-muted"
          variants={revealItemVariants}
        >
          Trusted by teams replacing brittle campaign spreadsheets.
        </motion.span>
      </motion.div>

      <div className="relative">
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
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
    <div className="flex flex-col gap-3 rounded-[2rem] border border-border/50 bg-surface p-6">
      <Icon icon="mdi:format-quote-open" width={28} />
      <p className="flex-1 text-lg leading-tight text-foreground">
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
