"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Same easing and timing as the hero section, so the whole page shares
    one motion vocabulary. */
const EASE = "easeOut" as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to hold before the reveal starts — used to stagger siblings. */
  delay?: number;
  /** Travel distance in px. Set to 0 for elements that shouldn't shift. */
  y?: number;
};

/**
 * Scroll-triggered entrance used by every section: short travel, no blur,
 * one easing curve. Honours prefers-reduced-motion by fading only.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 16,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      /* Negative bottom margin pulls the trigger zone up, so an element must
         travel well past the bottom edge before its entrance starts — the
         animation plays where the user can actually watch it. */
      viewport={{ once: true, amount: 0.3, margin: "0px 0px -96px 0px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
