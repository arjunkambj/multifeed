"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Component, type CSSProperties, type ReactNode, useRef } from "react";

import { MOCK_FRAME } from "./rhythm";

function DashboardMockPlaceholder() {
  return <div className={`${MOCK_FRAME} aspect-8/5 w-full`} />;
}

const DashboardMock = dynamic(
  () =>
    import("./DashboardMock").then((mod) => ({ default: mod.DashboardMock })),
  { ssr: false, loading: () => <DashboardMockPlaceholder /> },
);

class DashboardMockBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <DashboardMockPlaceholder />;
    return this.props.children;
  }
}

export function HeroMock() {
  const mockRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: mockRef,
    offset: ["start start", "end start"],
  });
  const mockY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? ["0px", "0px"] : ["0px", "48px"],
  );
  const mockScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1, 0.97],
  );

  return (
    <div ref={mockRef}>
      <motion.div
        className="origin-top transform-gpu will-change-transform"
        style={{ scale: mockScale, y: mockY }}
      >
        <div
          aria-label="MultiFeed calendar"
          className="relative w-full overflow-hidden rounded-panel"
          role="img"
        >
          <Image
            src="/hero-main.webp"
            alt=""
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1200px"
            className="object-cover object-center"
          />
          <div
            className="relative p-(--mock-pad)"
            style={{ "--mock-pad": "6%" } as CSSProperties}
          >
            <DashboardMockBoundary>
              <DashboardMock />
            </DashboardMockBoundary>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
