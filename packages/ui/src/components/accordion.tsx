import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { Add, ChevronDown, ChevronUp, Minus } from "@honeyicons/react";

import { cn } from "@multifeed/ui/lib/utils";

/**
 * `default` — one boxed list with dividers between items.
 * `card` — a stack of free-standing cards (marketing FAQ), so the root loses
 * its frame and every item carries its own surface, padding and type.
 */
type AccordionVariant = "default" | "card";

function Accordion({
  className,
  variant = "default",
  ...props
}: AccordionPrimitive.Root.Props & { variant?: AccordionVariant }) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn(
        "flex w-full flex-col",
        variant === "default" && "overflow-hidden rounded-2xl border",
        variant === "card" &&
          "gap-3 overflow-visible rounded-none border-0 md:gap-4",
        className,
      )}
      {...props}
    />
  );
}

function AccordionItem({
  className,
  variant = "default",
  ...props
}: AccordionPrimitive.Item.Props & { variant?: AccordionVariant }) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(
        "data-open:bg-muted/50",
        variant === "default" && "not-last:border-b",
        variant === "card" &&
          "rounded-card border-0 bg-card shadow-none ring-0 outline-none transition-colors not-last:border-0",
        className,
      )}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  indicator = "plus",
  variant = "default",
  ...props
}: AccordionPrimitive.Trigger.Props & {
  indicator?: "chevron" | "plus";
  variant?: AccordionVariant;
}) {
  const [ClosedIcon, OpenIcon] =
    indicator === "plus" ? [Add, Minus] : [ChevronDown, ChevronUp];

  const closedIconClasses =
    indicator === "plus"
      ? "pointer-events-none absolute inset-0 size-4 text-muted-foreground transition-all duration-200 rotate-0 group-hover/accordion-trigger:rotate-45 group-aria-expanded/accordion-trigger:rotate-90 group-aria-expanded/accordion-trigger:opacity-0 group-aria-expanded/accordion-trigger:scale-75"
      : "pointer-events-none absolute inset-0 size-4 text-muted-foreground transition-all duration-200 rotate-0 group-hover/accordion-trigger:rotate-12 group-aria-expanded/accordion-trigger:rotate-180 group-aria-expanded/accordion-trigger:opacity-0 group-aria-expanded/accordion-trigger:scale-75";

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between gap-6 border-0 p-4 text-left text-sm font-medium transition-all outline-none hover:no-underline aria-disabled:pointer-events-none aria-disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ml-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          variant === "card" &&
            "cursor-pointer p-6 text-[0.9375rem] leading-6 text-foreground [&_svg]:mt-[1px]",
          className,
        )}
        {...props}
      >
        {children}
        <span className="relative ml-auto size-4 shrink-0">
          <ClosedIcon
            size={16}
            data-slot="accordion-trigger-icon"
            className={closedIconClasses}
          />
          <OpenIcon
            size={16}
            data-slot="accordion-trigger-icon"
            className="pointer-events-none absolute inset-0 size-4 text-muted-foreground opacity-0 scale-75 transition-all duration-200 group-aria-expanded/accordion-trigger:opacity-100 group-aria-expanded/accordion-trigger:scale-100 group-aria-expanded/accordion-trigger:rotate-0"
          />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  variant = "default",
  ...props
}: AccordionPrimitive.Panel.Props & { variant?: AccordionVariant }) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="h-(--accordion-panel-height) overflow-hidden px-4 text-sm transition-[height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-starting-style:h-0 data-ending-style:h-0"
      {...props}
    >
      <div
        className={cn(
          "pt-0 pb-4 opacity-100 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-closed:opacity-0 data-ending-style:opacity-0 data-starting-style:opacity-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          variant === "card" &&
            "max-w-[62ch] px-2 pb-6 text-[0.9375rem] leading-7 text-pretty text-muted-foreground",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
