"use client";

import Image from "next/image";
import { motion } from "motion/react";

import { featureItems } from "@/constants/landing-page";
import {
  revealCardVariants,
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from "@/components/marketing/motion-variants";

export function Features() {
  const firstRow = featureItems.slice(0, 2);
  const secondRow = featureItems.slice(2);

  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24"
      id="features"
    >
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
          Features
        </motion.span>
        <motion.h2
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
          variants={revealItemVariants}
        >
          Agents plan. You approve. Networks publish.
        </motion.h2>
        <motion.p
          className="text-base leading-relaxed text-muted sm:text-lg"
          variants={revealItemVariants}
        >
          Autopilot for generation and scheduling — with a visual calendar so
          nothing ships without your eyes on it.
        </motion.p>
      </motion.div>

      <motion.div
        className="flex flex-col gap-4 md:gap-6"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          {firstRow.map((item) => (
            <motion.div
              className="h-full"
              key={item.heading}
              variants={revealCardVariants}
            >
              <FeatureCard item={item} />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {secondRow.map((item) => (
            <motion.div
              className="h-full"
              key={item.heading}
              variants={revealCardVariants}
            >
              <FeatureCard item={item} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function FeatureCard({ item }: { item: (typeof featureItems)[number] }) {
  return (
    <div className="marketing-surface flex h-full flex-col overflow-hidden border border-border/50 bg-surface">
      <div className="relative h-52 w-full md:h-56">
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
