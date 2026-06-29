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
      className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-24"
      id="features"
    >
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
          Features
        </motion.span>
        <motion.h2
          className="text-4xl font-bold leading-tight"
          variants={revealItemVariants}
        >
          Everything creator teams need to scale
        </motion.h2>
        <motion.span
          className="text-lg leading-relaxed text-muted"
          variants={revealItemVariants}
        >
          Track performance, contracts, links, and team operations from one
          clean workspace.
        </motion.span>
      </motion.div>

      <motion.div
        className="flex flex-col gap-6"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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

const FeatureCard = ({ item }: { item: (typeof featureItems)[number] }) => (
  <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-surface">
    <div className="relative h-56 w-full md:h-60">
      <Image
        alt={item.heading}
        className="object-cover"
        fill
        loading="lazy"
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        src={item.image}
      />
    </div>
    <div className="flex flex-col gap-2 p-6">
      <h3 className="text-xl font-semibold">{item.heading}</h3>
      <p className="text-sm leading-relaxed text-muted">{item.description}</p>
    </div>
  </div>
);
