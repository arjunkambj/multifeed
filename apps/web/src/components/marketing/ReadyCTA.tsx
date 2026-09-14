import { ChevronRight } from "@honeyicons/react";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import Reveal from "@/components/motion/Reveal";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@multifeed/ui/components/avatar";
import { buttonVariants } from "@multifeed/ui/components/button";
import { landingPeople } from "@/constants/landing-page";
import { cn } from "@multifeed/ui/lib/utils";
import {
  BODY,
  MOCK_CARD,
  PANEL_MEDIA,
  PANEL_PADDING,
  platforms,
  SECTION_HEADING,
  SOFT_CHIP,
} from "./rhythm";
import Section from "./Section";

/**
 * The accounts this mock post fans out to. Every avatar is the same person —
 * these are one founder's accounts across platforms, not five different
 * customers — so the row reads as one post fanning out, with the platform
 * badge carrying the "where".
 */
const poster = landingPeople.elena;

const accounts = [
  "Instagram",
  "Twitter/X",
  "TikTok",
  "LinkedIn",
  "YouTube",
].map((label) => {
  const platform = platforms.find((p) => p.label === label);
  if (!platform) throw new Error(`Unknown platform: ${label}`);
  return platform;
});

export function ReadyCTA() {
  return (
    <Section>
      <Reveal>
        <div className="grid items-center overflow-hidden rounded-panel bg-card md:grid-cols-2">
          <div className={cn("flex flex-col", PANEL_PADDING)}>
            <h2 className={SECTION_HEADING}>
              Plan the week.
              <span className="block font-normal text-muted-foreground">
                Then stop thinking about it.
              </span>
            </h2>
            <p className={`mt-5 max-w-sm text-muted-foreground ${BODY}`}>
              Connect your accounts, write the posts, drop them on the calendar.
            </p>
            <Link
              href="/sign-in"
              className={cn(
                buttonVariants({ size: "lg" }),
                "mt-8 w-fit px-8 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5",
              )}
            >
              Start free
              <ChevronRight data-icon="inline-end" />
            </Link>
          </div>

          <div
            className={cn(
              "relative h-full overflow-hidden bg-muted",
              PANEL_MEDIA,
            )}
          >
            <Image
              src="/hero-main.webp"
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover object-center"
            />

            <div className={cn(MOCK_CARD, "scale-[0.90]")}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm leading-5 font-medium">New post</p>
                <span className={SOFT_CHIP}>Today, 9:00 AM</span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Shipped the thing we&apos;ve been teasing for a month. Full
                write-up in the replies 👇
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-3 border-t pt-4">
                {/* Not overlapped — each avatar carries a badge, and an
                    overlap would hide the badge underneath the next one. */}
                <ul className="flex items-center gap-1.5 sm:gap-2">
                  {accounts.map((account) => (
                    <li
                      key={account.label}
                      className="relative shrink-0"
                      title={`Posting to ${account.label}`}
                    >
                      <Avatar className="size-7 sm:size-8">
                        <AvatarImage alt="" src={poster.src} />
                        <AvatarFallback>{poster.initials}</AvatarFallback>
                      </Avatar>
                      <span
                        aria-hidden
                        className="absolute -right-1 -bottom-1 grid size-3.75 place-items-center rounded-full bg-background ring-2 ring-background sm:size-4"
                      >
                        <account.icon
                          className="size-2 text-(--account-ink) sm:size-2.25"
                          style={
                            { "--account-ink": account.color } as CSSProperties
                          }
                        />
                      </span>
                    </li>
                  ))}
                </ul>
                <span className="text-xs leading-4 text-muted-foreground">
                  {accounts.length} accounts
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
