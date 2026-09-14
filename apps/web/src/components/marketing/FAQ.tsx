import Reveal from "@/components/motion/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@multifeed/ui/components/accordion";
import { cn } from "@multifeed/ui/lib/utils";

import { SUPPORT_EMAIL } from "./policies/policy-links";

import Section from "./Section";
import SectionHeader from "./SectionHeader";

import { ChevronRight } from "@honeyicons/react";
import Link from "next/link";

import { buttonVariants } from "@multifeed/ui/components/button";

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
          <Accordion variant="card">
            {faqItems.map((item) => (
              <AccordionItem key={item.title} value={item.title} variant="card">
                <AccordionTrigger indicator="plus" variant="card">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent variant="card">
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
