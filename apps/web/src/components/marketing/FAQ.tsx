"use client";

import { Accordion, buttonVariants } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";
import Link from "next/link";

import { faqItems } from "@/constants/landing-page";
import {
  revealCardVariants,
  revealContainerVariants,
  revealItemVariants,
  revealViewport,
} from "@/components/marketing/motion-variants";

export function FAQ() {
  return (
    <section
      className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-20 sm:px-6 md:gap-16 md:py-24"
      id="faq"
    >
      <motion.div
        className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        <motion.span
          className="text-sm font-semibold uppercase tracking-wide text-accent"
          variants={revealItemVariants}
        >
          FAQ
        </motion.span>
        <motion.h2
          className="font-display text-3xl font-bold tracking-tight sm:text-4xl"
          variants={revealItemVariants}
        >
          Questions, answered straight
        </motion.h2>
        <motion.p
          className="text-base leading-relaxed text-muted sm:text-lg"
          variants={revealItemVariants}
        >
          Agents, networks, and the calendar — what people ask before going on
          autopilot.
        </motion.p>
      </motion.div>

      <motion.div
        className="mx-auto flex w-full flex-col items-start justify-between gap-10 md:flex-row md:gap-12"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        <motion.div
          className="flex w-full max-w-sm flex-col gap-2 md:sticky md:top-28"
          variants={revealItemVariants}
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
        </motion.div>

        <motion.div
          className="flex w-full max-w-2xl justify-center"
          variants={revealCardVariants}
        >
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
        </motion.div>
      </motion.div>
    </section>
  );
}
