import { ChevronRight } from "@honeyicons/react";
import Link from "next/link";
import type { CSSProperties } from "react";

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@multifeed/ui/components/avatar";
import { buttonVariants } from "@multifeed/ui/components/button";
import { socialProofPeople } from "@/constants/landing-page";

import { HeroMock } from "./HeroMock";
import { platforms } from "./rhythm";
import Section from "./Section";

export function Hero() {
  return (
    <Section
      id="hero"
      className="overflow-hidden"
      containerClassName="relative pt-16 pb-16 md:pt-20 md:pb-20 lg:pt-24 lg:pb-24 xl:pt-28 xl:pb-28"
    >
      <div className="relative mx-auto w-full min-w-0 max-w-5xl text-center">
        <div
          className="marketing-hero-rise flex flex-wrap items-center justify-center gap-3.5 md:gap-4"
          style={{ "--hero-rise-delay": "80ms" } as CSSProperties}
        >
          {platforms.map((p) => (
            <span
              key={p.label}
              aria-label={p.label}
              title={p.label}
              className="inline-flex items-center justify-center opacity-90 transition-all duration-200 hover:scale-110 hover:opacity-100"
            >
              <p.icon
                className="size-7 text-(--platform-ink) md:size-8"
                style={{ "--platform-ink": p.color } as CSSProperties}
              />
            </span>
          ))}
        </div>

        <h1
          className="marketing-hero-rise font-heading mx-auto mt-6 w-full min-w-0 max-w-4xl text-(length:--h1-fs) leading-(--h1-lh) font-semibold tracking-(--h1-ls) text-pretty text-foreground sm:text-5xl sm:text-balance md:mt-7 md:max-w-none md:text-(length:--h1-fs-md) md:leading-(--h1-lh-md) lg:text-6xl xl:text-(length:--h1-fs-xl)"
          style={
            {
              "--hero-rise-delay": "180ms",
              "--h1-fs": "2.375rem",
              "--h1-lh": "1.04",
              "--h1-ls": "-0.035em",
              "--h1-fs-md": "3.5rem",
              "--h1-lh-md": "1.02",
              "--h1-fs-xl": "4.375rem",
            } as CSSProperties
          }
        >
          Post to all your social
          <span className="block sm:whitespace-nowrap">
            <span className="font-normal text-muted-foreground">
              accounts from one place
            </span>
          </span>
        </h1>

        <p
          className="marketing-hero-rise mx-auto mt-3 max-w-xl text-(length:--lede-fs) leading-8 text-pretty text-muted-foreground md:mt-4 md:text-lg"
          style={
            {
              "--hero-rise-delay": "280ms",
              "--lede-fs": "1.0625rem",
            } as CSSProperties
          }
        >
          Write the post once. Change the caption if a platform needs it. Drop
          it on the calendar.
        </p>

        <div
          className="marketing-hero-rise mt-7 flex flex-col items-center gap-4 md:mt-8 md:gap-5"
          style={{ "--hero-rise-delay": "380ms" } as CSSProperties}
        >
          <Link
            href="/sign-in"
            className={`${buttonVariants({ size: "lg" })} w-full px-8 has-[svg]:gap-2 sm:w-auto [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5`}
          >
            Try it for free
            <ChevronRight data-icon="inline-end" />
          </Link>

          <div className="flex items-center justify-center">
            <AvatarGroup>
              {socialProofPeople.map((person) => (
                <Avatar className="size-7" key={person.initials}>
                  <AvatarImage alt="" src={person.src} />
                  <AvatarFallback>{person.initials}</AvatarFallback>
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
        id="hero-mock"
        className="marketing-hero-mock relative mx-auto mt-9 w-full md:mt-10 lg:mt-12 xl:mt-14"
      >
        <HeroMock />
      </div>
    </Section>
  );
}
