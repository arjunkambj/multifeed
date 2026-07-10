"use client";

import { Accordion, buttonVariants } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

import { faqItems } from "@/constants/landing-page";

export function FAQ() {
  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24"
      data-gsap-section
      id="faq"
    >
      <div
        className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center"
        data-gsap-heading
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-accent">
          FAQ
        </span>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Questions, answered straight
        </h2>
        <p className="text-base leading-relaxed text-muted sm:text-lg">
          Agents, networks, and the calendar — what people ask before going on
          autopilot.
        </p>
      </div>

      <div className="mx-auto flex w-full flex-col items-start justify-between gap-10 md:flex-row md:gap-12">
        <div
          className="flex w-full max-w-sm flex-col gap-2 md:sticky md:top-28"
          data-gsap-card
        >
          <h3 className="text-xl font-medium sm:text-2xl">Still unsure?</h3>
          <p className="leading-relaxed text-muted">
            Tell us what you’re trying to ship — we’ll help you pick the right
            setup.
          </p>
          <Link
            className={`${buttonVariants()} button mt-4 w-fit`}
            href="/sign-in"
          >
            <Icon icon="mdi:chat-outline" />
            Talk to us
          </Link>
        </div>

        <div className="flex w-full max-w-2xl justify-center" data-gsap-card>
          <Accordion className="w-full">
            {faqItems.map((item, index) => (
              <Accordion.Item key={item.title} id={`${index}`}>
                <Accordion.Heading>
                  <Accordion.Trigger className="text-base font-medium sm:text-lg">
                    {item.title}
                    <Accordion.Indicator>
                      <Icon icon="mdi:chevron-down" />
                    </Accordion.Indicator>
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body>{item.content}</Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
