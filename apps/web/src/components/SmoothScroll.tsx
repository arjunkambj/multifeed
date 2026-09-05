"use client";

import Lenis from "lenis";
import { cancelFrame, frame } from "motion";
import { useEffect, type ReactNode } from "react";

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      autoRaf: false,
      anchors: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.25,
    });

    const update = ({ timestamp }: { timestamp: number }) => {
      lenis.raf(timestamp);
    };
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      lenis.destroy();
    };
  }, []);

  return children;
}
