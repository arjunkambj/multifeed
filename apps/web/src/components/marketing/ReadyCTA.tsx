import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/motion/Reveal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BODY, PANEL_MEDIA, PANEL_PADDING, SOFT_CHIP } from "./rhythm";
import Section from "./Section";

export function ReadyCTA() {
  return (
    <Section>
      {/* No SectionHeader above this one — the Section's own padding is the
          only top spacing it needs. */}
      <Reveal>
        <div className="grid items-center overflow-hidden rounded-panel bg-zinc-100 md:grid-cols-2 dark:bg-zinc-800">
          <div className={cn("flex flex-col", PANEL_PADDING)}>
            <h2 className="font-heading text-[1.875rem] leading-[1.08] font-medium tracking-[-0.032em] text-balance sm:text-[2.25rem] md:text-[2.5rem] md:leading-[1.06] lg:text-[2.75rem]">
              Your week of posts,
              <span className="block font-normal text-muted-foreground">
                done before lunch.
              </span>
            </h2>
            <p className={`mt-5 max-w-sm text-muted-foreground ${BODY}`}>
              Connect your accounts and drag the week onto the calendar.
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

          {/* Image panel — artwork fills right side flush */}
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

            {/* Floating mock post card */}
            <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 scale-[0.90] rounded-card border bg-card p-4 shadow-2xl shadow-black/10 sm:inset-x-8 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm leading-5 font-medium">New post</p>
                <span className={SOFT_CHIP}>Today, 9:00 AM</span>
              </div>

              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Shipped the thing we&apos;ve been teasing for a month. Full
                write-up in the replies 👇
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-3 border-t pt-4">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {["IG", "X", "TT", "IN", "YT"].map((initials) => (
                    <Avatar key={initials} className="size-7 sm:size-8">
                      <AvatarFallback className="text-[0.625rem] font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-xs leading-4 text-muted-foreground">
                  5 accounts
                </span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
