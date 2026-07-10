"use client";

import { buttonVariants, Chip } from "@heroui/react";
import Link from "next/link";

export function Hero() {
  return (
    <section
      className="relative mx-auto flex min-h-[58dvh] w-full max-w-7xl flex-col gap-12 px-4 pb-16 pt-20 sm:px-6 sm:pt-24 md:gap-14 md:pb-20 lg:pt-36"
      id="hero"
    >
      <div
        className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 text-center lg:mt-4"
        data-gsap-hero-copy
      >
        <div>
          <Chip className="marketing-chip border border-border/60 bg-surface px-3 py-1 text-accent">
            AI agents · 30+ social networks
          </Chip>
        </div>

        <h1 className="font-display max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.05]">
          Run your social media on autopilot with{" "}
          <span className="relative inline-block whitespace-nowrap">
            AI agents
            <span
              aria-hidden
              className="absolute inset-x-0 -bottom-1 h-[0.18em] rounded-full bg-accent sm:-bottom-1.5"
              data-gsap-underline
            />
          </span>
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          Plan, generate, and schedule posts automatically to 30+ social media
          networks — then review and edit everything in a visual calendar.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <Link
            className={`${buttonVariants({ size: "lg" })} button`}
            href="/sign-in"
          >
            Start free for 7 days
          </Link>
          <Link
            className={`${buttonVariants({ size: "lg", variant: "tertiary" })} button`}
            href="#pricing"
          >
            See pricing
          </Link>
        </div>

        <p className="max-w-xl text-sm leading-relaxed text-muted">
          Use any agent:{" "}
          <span className="font-medium text-foreground/80">
            OpenClaw / Hermes / Claude / ChatGPT / Codex / Cursor
          </span>
        </p>
      </div>

      {/* Image frame — drop product screenshots here later */}
      <div
        className="relative z-10 mx-auto w-full max-w-5xl"
        data-gsap-hero-visual
      >
        <div className="marketing-surface overflow-hidden border border-border/60 bg-surface shadow-xl shadow-foreground/5 dark:shadow-black/30">
          {/* Window chrome */}
          <div className="flex h-11 items-center gap-3 border-b border-border/50 bg-surface-secondary/50 px-4">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-[#FF5F57]" />
              <span className="size-2.5 rounded-full bg-[#FEBC2E]" />
              <span className="size-2.5 rounded-full bg-[#28C840]" />
            </div>
            <div className="mx-auto flex h-7 max-w-xs flex-1 items-center justify-center rounded-lg border border-border/40 bg-background px-3">
              <span className="truncate text-[11px] font-medium text-muted">
                app.multifeed.io
              </span>
            </div>
            <div className="hidden w-14 sm:block" />
          </div>

          {/* Main image slot */}
          <div className="relative aspect-[16/10] w-full bg-surface-secondary/40">
            {/*
              Replace this empty frame with:
              <Image src="/hero.png" alt="Multi Feed dashboard" fill className="object-cover object-top" />
            */}
            <div className="absolute inset-4 rounded-xl border border-dashed border-border/60 bg-background/60 sm:inset-5 md:inset-6" />
          </div>
        </div>
      </div>
    </section>
  );
}
