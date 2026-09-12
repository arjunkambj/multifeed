"use client";

import { ChevronRight } from "@honeyicons/react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Component, type ReactNode, useRef } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { socialProofPeople } from "@/constants/landing-page";

import { MOCK_FRAME, PLATFORM_ICON, platforms } from "./rhythm";
import Section from "./Section";

function DashboardMockPlaceholder() {
  return (
    <div
      className={`${MOCK_FRAME} w-full`}
      style={{ aspectRatio: "1280 / 800" }}
    />
  );
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

export function Hero() {
  const mockRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: mockRef,
    offset: ["start start", "end start"],
  });
  const mockY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 48],
  );
  const mockScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1, 0.97],
  );

  return (
    <Section
      id="hero"
      className="overflow-hidden"
      containerClassName="relative pt-16 pb-16 md:pt-20 md:pb-20 lg:pt-24 lg:pb-24 xl:pt-28 xl:pb-28"
    >
      <div className="relative mx-auto w-full min-w-0 max-w-5xl text-center">
        <div
          className="marketing-hero-rise flex flex-wrap items-center justify-center gap-3.5 md:gap-4"
          style={{ animationDelay: "80ms" }}
        >
          {platforms.map((p) => (
            <span
              key={p.label}
              aria-label={p.label}
              title={p.label}
              className="inline-flex items-center justify-center opacity-90 transition-all duration-200 hover:scale-110 hover:opacity-100"
            >
              <p.icon className={PLATFORM_ICON} style={{ color: p.color }} />
            </span>
          ))}
        </div>

        <h1
          className="marketing-hero-rise font-heading mx-auto mt-6 w-full min-w-0 max-w-4xl text-[2.375rem] leading-[1.04] font-semibold tracking-[-0.035em] text-pretty text-foreground sm:text-[3rem] sm:text-balance md:mt-7 md:max-w-none md:text-[3.5rem] md:leading-[1.02] lg:text-6xl xl:text-[4.375rem]"
          style={{ animationDelay: "180ms" }}
        >
          Post to all your social
          <span className="block sm:whitespace-nowrap">
            <span className="font-normal text-muted-foreground">
              accounts from one place
            </span>
          </span>
        </h1>

        <p
          className="marketing-hero-rise mx-auto mt-3 max-w-xl text-[1.0625rem] leading-8 text-pretty text-muted-foreground md:mt-4 md:text-[1.125rem]"
          style={{ animationDelay: "280ms" }}
        >
          Write the post once. Change the caption if a platform needs it. Drop
          it on the calendar.
        </p>

        <div
          className="marketing-hero-rise mt-7 flex flex-col items-center gap-4 md:mt-8 md:gap-5"
          style={{ animationDelay: "380ms" }}
        >
          <Link
            href="/sign-in"
            className={`${buttonVariants({ size: "lg" })} w-full px-8 has-[svg]:gap-2 sm:w-auto [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5`}
          >
            Try it for free
            <ChevronRight data-icon="inline-end" />
          </Link>

          <div className="flex items-center justify-center">
            <AvatarGroup className="-space-x-2.5">
              {socialProofPeople.map((person) => (
                <Avatar className="size-7" key={person.initials} size="sm">
                  <AvatarImage alt="" src={person.src} />
                  <AvatarFallback className="text-[0.625rem] font-medium">
                    {person.initials}
                  </AvatarFallback>
                </Avatar>
              ))}
            </AvatarGroup>
            <p className="ml-3 text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">100+</span> people
              use it
            </p>
          </div>
        </div>
      </div>

      <div
        ref={mockRef}
        id="hero-mock"
        className="marketing-hero-mock relative mx-auto mt-9 w-full md:mt-10 lg:mt-12 xl:mt-14"
      >
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
            <div className="relative p-[6%]">
              <DashboardMockBoundary>
                <DashboardMock />
              </DashboardMockBoundary>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
