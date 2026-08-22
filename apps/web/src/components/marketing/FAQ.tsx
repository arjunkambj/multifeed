import Reveal from "@/components/motion/Reveal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import { faqItems } from "@/constants/landing-page";

import { BODY, GRID_GAP, HEADER_GAP } from "./rhythm";
import Section from "./Section";
import SectionHeader from "./SectionHeader";

export function FAQ() {
  return (
    <Section id="faq">
      <SectionHeader
        align="left"
        eyebrow="FAQ"
        title="You have questions."
        titleMuted="We have answers."
      />

      {/* Two columns of standalone cards; items-start keeps a card from
          stretching when its neighbour is open. */}
      <Reveal className={HEADER_GAP}>
        <Accordion
          className={cn(
            GRID_GAP,
            "grid overflow-visible rounded-none border-0 md:grid-cols-2 md:items-start",
          )}
        >
          {faqItems.map((item) => (
            <AccordionItem
              key={item.title}
              value={item.title}
              className="rounded-card border-0 bg-secondary shadow-none ring-0 outline-none transition-colors not-last:border-0 data-open:bg-secondary"
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
    </Section>
  );
}
