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

import { ChevronRight } from "@honeyicons/react";
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
            title="Questions."
            titleMuted="The ones we get a lot."
            description="If yours isn't here, email us."
          />
          <Link
            href={`mailto:${SUPPORT_EMAIL}`}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-8 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5",
            )}
          >
            Email us
            <ChevronRight data-icon="inline-end" />
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
                className="rounded-card border-0 bg-card shadow-none ring-0 outline-none transition-colors not-last:border-0"
              >
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
