import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { landingPeople } from "@/constants/landing-page";
import { cn } from "@/lib/utils";
import {
  BODY,
  MOCK_CARD,
  PANEL_MEDIA,
  PANEL_PADDING,
  platforms,
  SOFT_CHIP,
} from "./rhythm";
import Section from "./Section";

/**
 * The accounts this mock post fans out to. Every avatar is the same person —
 * these are one founder's accounts across platforms, not five different
 * customers — so the row reads as one post fanning out, with the platform
 * badge carrying the "where".
 */
const poster = landingPeople.tom;

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
            <h2 className="font-heading text-[1.875rem] leading-[1.08] font-medium tracking-[-0.032em] text-balance sm:text-[2.25rem] md:text-[2.5rem] md:leading-[1.06] lg:text-[2.75rem]">
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
              <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
            </Link>
          </div>

          <div
            className={cn(
              "relative h-full overflow-hidden bg-muted",
              PANEL_MEDIA,
            )}
          >
            <Image
              src="/hero-main.png"
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
                        <AvatarFallback className="text-[0.625rem] font-medium">
                          {poster.initials}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        aria-hidden
                        className="absolute -right-1 -bottom-1 grid size-[15px] place-items-center rounded-full bg-background ring-2 ring-background sm:size-4"
                      >
                        <Icon
                          icon={account.icon}
                          className="size-2 sm:size-[9px]"
                          style={{ color: account.color }}
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
