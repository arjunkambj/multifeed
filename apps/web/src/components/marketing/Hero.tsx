"use client";

import { buttonVariants, Chip } from "@heroui/react";
import { motion } from "motion/react";
import Link from "next/link";

import {
  revealContainerVariants,
  revealItemVariants,
} from "@/components/marketing/motion-variants";

const imageVariants = {
  animate: {
    opacity: 1,
    scale: 1,
    transition: { delay: 0.3, duration: 0.8, ease: "easeInOut" as const },
    y: 0,
  },
  initial: { opacity: 0, scale: 0.8, y: 40 },
};

export function Hero() {
  return (
    <section
      className="relative flex min-h-[60dvh] w-full flex-col gap-12 px-4 pb-20 pt-24 sm:pt-28"
      id="hero"
    >
      <motion.div
        animate="animate"
        className="relative z-10 flex flex-col items-center gap-4"
        initial="initial"
        variants={revealContainerVariants}
      >
        <motion.div
          className="rounded-2xl border border-border/60 bg-surface/80 px-3 py-1"
          variants={revealItemVariants}
        >
          <Chip className="rounded-xl bg-transparent px-0 py-0 text-accent">
            Social posting, without the tabs
          </Chip>
        </motion.div>
        <motion.h1
          className="mt-2 max-w-5xl text-center text-5xl font-bold leading-none sm:text-6xl lg:text-7xl"
          variants={revealItemVariants}
        >
          Post to all your social accounts from one dashboard
        </motion.h1>
        <motion.p
          className="max-w-3xl text-center text-base leading-tight text-muted sm:text-lg"
          variants={revealItemVariants}
        >
          Everything flows better when your content, data, and team are all in
          the same tab.
        </motion.p>
        <motion.div
          className="flex flex-wrap justify-center gap-3"
          variants={revealItemVariants}
        >
          <Link className={buttonVariants({ size: "lg" })} href="/sign-in">
            Start posting
          </Link>
          <Link
            className={buttonVariants({ size: "lg", variant: "tertiary" })}
            href="#features"
          >
            See pricing
          </Link>
        </motion.div>
      </motion.div>
      <motion.div
        animate="animate"
        className="relative z-10 mx-auto aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-surface/80 shadow-2xl shadow-foreground/10 dark:border dark:border-border/60 dark:bg-surface/70 dark:shadow-black/50"
        initial="initial"
        variants={imageVariants}
      />
    </section>
  );
}
