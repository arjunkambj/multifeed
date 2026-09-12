"use client";

import { Calendar, ChevronDown } from "@honeyicons/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type CalendarDateRange,
  DATE_RANGE_PRESETS,
  type DateRangePreset,
} from "@/lib/date-ranges";

const OverviewDateRangeContent = dynamic(
  () =>
    import("./OverviewDateRangeContent").then(
      (module) => module.OverviewDateRangeContent,
    ),
  {
    loading: () => (
      <p role="status" className="p-4 text-sm text-muted-foreground">
        Loading calendar…
      </p>
    ),
  },
);

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(date: CalendarDateRange["start"]) {
  return dateFormatter.format(new Date(date.year, date.month - 1, date.day));
}

type Props = {
  value: CalendarDateRange;
  preset: DateRangePreset | null;
  onChange: (range: CalendarDateRange, preset: DateRangePreset | null) => void;
};

export function OverviewDateRangePicker({ value, preset, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const label = preset
    ? DATE_RANGE_PRESETS[preset].label
    : value.start.compare(value.end) === 0
      ? formatDate(value.start)
      : `${formatDate(value.start)} – ${formatDate(value.end)}`;

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open, details) => {
        if (!open && details.reason === "outside-press") {
          const target = details.event.target;
          const element =
            target instanceof Element
              ? target
              : target instanceof Node
                ? target.parentElement
                : null;
          if (element?.closest("[data-slot='date-picker-content']")) {
            details.cancel();
            return;
          }
        }
        setIsOpen(open);
      }}
    >
      <PopoverTrigger
        render={
          <Button variant="secondary" className="min-w-36 justify-between" />
        }
      >
        <Calendar size={16} />
        <span className="text-sm font-medium">{label}</span>
        <ChevronDown size={14} />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-auto max-w-[calc(100vw-2rem)] p-0"
      >
        {isOpen && (
          <OverviewDateRangeContent
            value={value}
            preset={preset}
            onChange={onChange}
            onClose={() => setIsOpen(false)}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
