"use client";

import { buttonVariants } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import { whyUsPoints } from "@/constants/landing-page";
import {
  revealCardVariants,
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from "@/components/marketing/motion-variants";

export function WhyUS() {
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
          Why unifeed
        </motion.span>
        <motion.h2
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
          variants={revealItemVariants}
        >
          Social on autopilot — without losing control
        </motion.h2>
        <motion.p
          className="text-base leading-relaxed text-muted sm:text-lg"
          variants={revealItemVariants}
        >
          AI agents generate. unifeed schedules across 30+ networks. You review
          everything on one calendar.
        </motion.p>
      </motion.div>

      <motion.div
        className="flex w-full flex-col gap-4 md:gap-6"
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

function WhyUSCard({
  point,
  reversed,
}: {
  point: (typeof whyUsPoints)[number];
  reversed: boolean;
}) {
  return (
    <div className="marketing-surface flex w-full flex-col justify-between gap-6 overflow-hidden border border-border/50 bg-surface p-5 sm:p-6 md:flex-row md:gap-10 md:p-10">
      <div
        className={`marketing-media relative flex aspect-square w-full shrink-0 items-center justify-center overflow-hidden bg-surface-secondary md:w-80 lg:w-96 ${
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
