"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/** Gentle deceleration — long tail, no snap. Tasteful over flashy. */
const EASE = [0.22, 1, 0.36, 1] as const;

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to hold before the reveal starts — used to stagger siblings. */
  delay?: number;
  /** Travel distance in px. Set to 0 for elements that shouldn't shift. */
  y?: number;
};

/**
 * Scroll-triggered entrance used by every section, so the whole page enters
 * with one motion vocabulary: short travel, soft blur-out, one easing curve.
 * Honours prefers-reduced-motion by fading only — no travel, no blur.
 */
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
}: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion ? { opacity: 0 } : { opacity: 0, y, filter: "blur(6px)" }
      }
      whileInView={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, filter: "blur(0px)" }
      }
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
