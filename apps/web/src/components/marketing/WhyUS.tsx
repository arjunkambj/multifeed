"use client";

import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import Image from "next/image";

import { whyUsPoints } from "@/constants/landing-page";
import {
  revealCardVariants,
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from "@/components/marketing/motion-variants";

export function WhyUS() {
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
          Why us
        </motion.span>
        <motion.h2
          className="text-4xl font-bold leading-tight"
          variants={revealItemVariants}
        >
          Why choose Unifeed
        </motion.h2>
        <motion.span
          className="text-lg leading-relaxed text-muted"
          variants={revealItemVariants}
        >
          Built for modern creator operations where performance, process, and
          attribution need to live together.
        </motion.span>
      </motion.div>
      <motion.div
        className="mx-auto flex w-full flex-col gap-8"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        {whyUsPoints.map((point, index) => (
          <motion.div key={point.title} variants={revealCardVariants}>
            <WhyUSCard point={point} reversed={index % 2 === 1} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

const WhyUSCard = ({
  point,
  reversed,
}: {
  point: (typeof whyUsPoints)[number];
  reversed: boolean;
}) => (
  <div className="flex w-full max-w-7xl flex-col justify-between gap-8 overflow-hidden rounded-[2rem] border border-border/50 bg-surface px-6 py-6 md:flex-row md:px-12 md:py-12">
    <div
      className={`relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-surface-secondary md:w-96 ${
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
    <div className="flex flex-1 flex-col justify-center gap-3 md:max-w-lg">
      <span className="text-sm font-medium uppercase tracking-wide text-accent">
        {point.subheading}
      </span>
      <h3 className="text-3xl font-semibold md:text-4xl">{point.title}</h3>
      <p className="leading-relaxed text-muted">{point.description}</p>
      <Button className="mt-3 w-fit" size="lg">
        {point.cta}
        <Icon icon="mdi:arrow-right" />
      </Button>
    </div>
  </div>
);
