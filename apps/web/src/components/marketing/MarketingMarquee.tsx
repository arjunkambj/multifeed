"use client";

import Image from "next/image";
import { motion } from "motion/react";

import { brands } from "@/constants/landing-page";
import {
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from "@/components/marketing/motion-variants";

export function MarketingMarquee() {
  return (
    <section className="w-full overflow-hidden pb-24">
      <motion.div
        className="mx-auto max-w-6xl"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        <motion.h2
          className="mb-8 text-center text-2xl font-medium"
          variants={revealItemVariants}
        >
          Built for the channels your creators already use
        </motion.h2>
      </motion.div>
      <motion.div
        className="relative mx-auto max-w-4xl overflow-hidden"
        initial="initial"
        variants={revealItemVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent"
        />
        <div className="flex animate-[marquee_30s_linear_infinite]">
          {[...brands, ...brands, ...brands].map(([name, logo], index) => (
            <div
              className="flex shrink-0 items-center gap-4 px-12"
              key={`${name}-${index}`}
            >
              <div className="relative h-8 w-32">
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
      </motion.div>
    </section>
  );
}
