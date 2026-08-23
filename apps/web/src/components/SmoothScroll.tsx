"use client";

import Lenis from "lenis";
import { cancelFrame, frame } from "motion";
import { useEffect, useRef, type ReactNode } from "react";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

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
    lenisRef.current = lenis;

    const update = ({ timestamp }: { timestamp: number }) => {
      lenis.raf(timestamp);
    };
    frame.update(update, true);

    return () => {
      cancelFrame(update);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return children;
}
