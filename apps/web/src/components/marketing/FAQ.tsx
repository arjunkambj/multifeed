import Reveal from "@/components/motion/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { SUPPORT_EMAIL } from "./policies/policy-links";

import { BODY, GRID_GAP } from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

import { faqItems } from "@/constants/landing-page";

export function FAQ() {
  return (
    <Section id="faq">
      <div className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16">
        <div className="md:sticky md:top-24 md:self-start">
          <SectionHeader
            align="left"
            eyebrow="FAQ"
            title="You have questions."
            titleMuted="Straight answers."
            description="Still curious?"
          />
          <Link
            href={`mailto:${SUPPORT_EMAIL}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-8 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5",
            )}
          >
            Chat with us
            <HugeiconsIcon icon={ArrowRight01Icon} data-icon="inline-end" />
          </Link>
        </div>

        <Reveal>
          <Accordion
            className={cn(GRID_GAP, "flex flex-col overflow-visible rounded-none border-0")}
          >
            {faqItems.map((item) => (
              <AccordionItem
                key={item.title}
                value={item.title}
                className="rounded-card border-0 bg-zinc-100 shadow-none ring-0 outline-none transition-colors not-last:border-0 dark:bg-zinc-800"
              >
                {/* Trigger padding is the page's card padding; the panel adds its
                    own px-4, so px-2 here lands the answer on the same left edge. */}
                <AccordionTrigger
                  indicator="plus"
                  className="cursor-pointer items-start p-6 text-left text-[0.9375rem] leading-6 font-medium text-foreground hover:no-underline [&_svg]:mt-[1px]"
                >
                  {item.title}
                </AccordionTrigger>
                <AccordionContent
                  className={`max-w-[62ch] px-2 pb-6 text-muted-foreground ${BODY}`}
                >
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </Section>
  );
}
