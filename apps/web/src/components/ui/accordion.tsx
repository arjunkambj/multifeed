import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { Icon } from "@iconify/react";

import { cn } from "@/lib/utils";

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border",
        className,
      )}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b data-open:bg-muted/50", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  indicator = "plus",
  ...props
}: AccordionPrimitive.Trigger.Props & { indicator?: "chevron" | "plus" }) {
  const [closedIcon, openIcon] =
    indicator === "plus"
      ? ["lucide:plus", "lucide:minus"]
      : ["lucide:chevron-down", "lucide:chevron-up"];

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
          className,
        )}
        {...props}
      >
        {children}
        <span className="relative ml-auto size-4 shrink-0">
          <Icon
            icon={closedIcon}
            width={16}
            height={16}
            data-slot="accordion-trigger-icon"
            className={closedIconClasses}
          />
          <Icon
            icon={openIcon}
            width={16}
            height={16}
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
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      className="overflow-hidden px-4 text-sm duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-open:animate-accordion-down data-closed:animate-accordion-up"
      {...props}
    >
      <div
        className={cn(
          "h-(--accordion-panel-height) pt-0 pb-4 opacity-100 transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-closed:opacity-0 data-ending-style:opacity-0 data-starting-style:opacity-0 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
