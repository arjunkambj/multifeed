"use client";

import { Accordion, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";

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
      className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 py-24"
      id="faq"
    >
      <motion.div
        className="flex flex-col items-center gap-2 text-center"
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
          className="text-4xl font-bold leading-tight"
          variants={revealItemVariants}
        >
          Frequently asked questions
        </motion.h2>
        <motion.span
          className="text-lg leading-relaxed text-muted"
          variants={revealItemVariants}
        >
          Find answers to common questions about tracking creator campaigns with
          Unifeed.
        </motion.span>
      </motion.div>
      <motion.div
        className="mx-auto flex w-full flex-col items-start justify-between gap-12 md:flex-row md:px-12"
        initial="initial"
        variants={revealContainerVariants}
        viewport={revealViewport}
        whileInView="animate"
      >
        <motion.div
          className="flex w-full max-w-sm flex-col gap-1 md:sticky md:top-32"
          variants={revealItemVariants}
        >
          <h3 className="text-2xl font-medium">Need personalized help?</h3>
          <p className="leading-relaxed text-muted">
            Drop a note to our support team and we&apos;ll point you in the
            right direction.
          </p>
          <Button className="mt-5 w-fit">
            <Icon icon="mdi:chat-outline" />
            Ask us anything
          </Button>
        </motion.div>
        <motion.div
          className="flex w-full max-w-2xl justify-center"
          variants={revealCardVariants}
        >
          <Accordion className="w-full">
            {faqItems.map((item, index) => accordionItem(item, index))}
          </Accordion>
        </motion.div>
      </motion.div>
    </section>
  );
}

function accordionItem(item: (typeof faqItems)[number], index: number) {
  return (
    <Accordion.Item key={item.title} id={`${index}`}>
      <Accordion.Heading>
        <Accordion.Trigger className="text-lg font-medium">
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
  );
}
