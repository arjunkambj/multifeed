"use client";

import { useCallback, useMemo, useState } from "react";
import { Button, Input, Popover, RangeCalendar } from "@heroui/react";
import { Icon } from "@iconify/react";
import {
  type CalendarDate,
  type DateValue,
  getLocalTimeZone,
  parseDate,
  today,
} from "@internationalized/date";
import {
  DATE_RANGE_PRESETS,
  type CalendarDateRange,
  type DateRangePreset,
  calendarDateToInputValue,
  getPresetRange,
} from "@/lib/date-ranges";

type RangeValue<T> = { start: T; end: T };

type Props = {
  value: CalendarDateRange;
  preset: DateRangePreset | null;
  onChange: (range: CalendarDateRange, preset: DateRangePreset | null) => void;
};

function toCalendarDate(value: DateValue): CalendarDate {
  if ("toCalendarDate" in value && typeof value.toCalendarDate === "function") {
    return value.toCalendarDate();
  }
  return value as CalendarDate;
}

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(date: CalendarDate) {
  return dateFormatter.format(new Date(date.year, date.month - 1, date.day));
}

export function OverviewDateRangePicker({ value, preset, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const maxDate = today(getLocalTimeZone());
  const maxInputDate = calendarDateToInputValue(maxDate);

  const label = useMemo(() => {
    if (preset) return DATE_RANGE_PRESETS[preset].label;
    if (value.start.compare(value.end) === 0) return formatDate(value.start);
    return `${formatDate(value.start)} – ${formatDate(value.end)}`;
  }, [preset, value]);

  const selectPreset = (nextPreset: DateRangePreset) => {
    const range = getPresetRange(nextPreset);
    setDraft(range);
    onChange(range, nextPreset);
    setIsOpen(false);
  };

  const selectRange = useCallback(
    (range: RangeValue<DateValue>) => {
      const nextRange = {
        start: toCalendarDate(range.start),
        end: toCalendarDate(range.end ?? range.start),
      };
      setDraft(nextRange);
      if (range.end) {
        onChange(nextRange, null);
        setIsOpen(false);
      }
    },
    [onChange],
  );

  const typeDate = (field: "start" | "end", input: string) => {
    if (input.length !== 10) return;
    try {
      const parsed = parseDate(input);
      const candidate = { ...draft, [field]: parsed };
      const nextRange =
        candidate.start.compare(candidate.end) <= 0
          ? candidate
          : { start: candidate.end, end: candidate.start };
      setDraft(nextRange);
      onChange(nextRange, null);
    } catch {
      // Keep the last valid range while the user edits the field.
    }
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (open) setDraft(value);
      }}
    >
      <Button size="sm" variant="tertiary" className="min-w-36 justify-between">
        <Icon icon="hugeicons:calendar-03" width={16} />
        <span className="text-sm font-medium">{label}</span>
        <Icon icon="hugeicons:arrow-down-01" width={14} />
      </Button>
      <Popover.Content
        placement="bottom end"
        className="max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl p-0"
      >
        <Popover.Dialog className="p-0">
          <div className="flex max-sm:flex-col">
            <aside className="w-36 shrink-0 border-r border-border bg-surface-secondary p-3 max-sm:w-full max-sm:border-r-0 max-sm:border-b">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Quick ranges
              </p>
              <div className="flex flex-col gap-0.5 max-sm:flex-row max-sm:overflow-x-auto">
                {(Object.keys(DATE_RANGE_PRESETS) as DateRangePreset[]).map(
                  (key) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={preset === key ? "secondary" : "tertiary"}
                      className="h-7 justify-start whitespace-nowrap bg-transparent px-3 py-0 text-xs"
                      onPress={() => selectPreset(key)}
                    >
                      {DATE_RANGE_PRESETS[key].label}
                    </Button>
                  ),
                )}
              </div>
            </aside>

            <div className="w-[26.5rem] max-w-full shrink-0 overflow-x-auto bg-surface p-3">
              <div className="mb-3 grid grid-cols-2 gap-2">
                <Input
                  aria-label="Start date"
                  type="date"
                  max={maxInputDate}
                  variant="secondary"
                  className="h-9 text-sm"
                  value={calendarDateToInputValue(draft.start)}
                  onChange={(event) => typeDate("start", event.currentTarget.value)}
                />
                <Input
                  aria-label="End date"
                  type="date"
                  max={maxInputDate}
                  variant="secondary"
                  className="h-9 text-sm"
                  value={calendarDateToInputValue(draft.end)}
                  onChange={(event) => typeDate("end", event.currentTarget.value)}
                />
              </div>

              <RangeCalendar
                aria-label="Overview date range"
                className="w-full max-w-none overflow-visible [&_.range-calendar__cell-button]:!size-6 [&_.range-calendar__cell-button]:!text-xs [&_.range-calendar__cell]:!my-0 [&_.range-calendar__grid]:!w-[11.75rem] [&_.range-calendar__header-cell]:!pb-1 [&_.range-calendar__header-cell]:!text-[11px] [&_.range-calendar__header]:!pb-2 [&_.range-calendar__nav-button-icon]:!size-3.5 [&_.range-calendar__nav-button]:!size-5"
                firstDayOfWeek="mon"
                maxValue={maxDate}
                visibleDuration={{ months: 2 }}
                value={draft}
                onChange={selectRange}
              >
                <RangeCalendar.Header>
                  <RangeCalendar.NavButton slot="previous" />
                  <RangeCalendar.Heading className="text-xs font-semibold" />
                  <RangeCalendar.NavButton slot="next" />
                </RangeCalendar.Header>
                <div className="flex gap-2">
                  <CalendarMonth />
                  <CalendarMonth offset={1} />
                </div>
                <RangeCalendar.YearPickerGrid>
                  <RangeCalendar.YearPickerGridBody>
                    {({ year }) => <RangeCalendar.YearPickerCell year={year} />}
                  </RangeCalendar.YearPickerGridBody>
                </RangeCalendar.YearPickerGrid>
              </RangeCalendar>
            </div>
          </div>
        </Popover.Dialog>
      </Popover.Content>
    </Popover>
  );
}

function CalendarMonth({ offset = 0 }: { offset?: number }) {
  return (
    <div className="w-[11.75rem] shrink-0">
      <RangeCalendar.Grid offset={offset ? { months: offset } : undefined}>
        <RangeCalendar.GridHeader>
          {(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
        </RangeCalendar.GridHeader>
        <RangeCalendar.GridBody>
          {(date) => <RangeCalendar.Cell date={date} />}
        </RangeCalendar.GridBody>
      </RangeCalendar.Grid>
    </div>
  );
}
