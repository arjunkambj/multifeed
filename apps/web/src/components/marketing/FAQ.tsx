"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";

import { faqItems } from "@/constants/landing-page";

export function FAQ() {
  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24"
      id="faq"
    >
      <div
        className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">
          FAQ
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Know before you schedule
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          The practical details about platforms, post formats, teamwork, and
          pricing.
        </p>
      </div>

      <div className="mx-auto flex w-full flex-col items-start justify-between gap-10 md:flex-row md:gap-12">
        <div
          className="flex w-full max-w-sm flex-col gap-2 md:sticky md:top-28"
        >
          <h3 className="text-xl font-medium sm:text-2xl">Still unsure?</h3>
          <p className="leading-relaxed text-muted-foreground">
            Tell us how you publish today. We’ll help you choose the right
            setup.
          </p>
          <Link
            className={buttonVariants({ variant: "default" })}
            href="/sign-in"
          >
            <Icon icon="mdi:chat-outline" width={16} />
            Ask a question
          </Link>
        </div>

        <div className="flex w-full max-w-2xl justify-center">
          <Accordion className="w-full" multiple>
            {faqItems.map((item, index) => (
              <AccordionItem key={item.title} value={`${index}`}>
                <AccordionTrigger className="text-base font-medium sm:text-lg">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent>{item.content}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
