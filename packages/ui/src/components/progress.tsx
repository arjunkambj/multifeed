"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@multifeed/ui/lib/utils";

const progressVariants = cva("flex", {
  variants: {
    variant: {
      default: "flex-wrap gap-3",
      stack: "w-full flex-col gap-2.5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Progress({
  className,
  children,
  hideTrack = false,
  trackVariant = "default",
  value,
  variant = "default",
  ...props
}: ProgressPrimitive.Root.Props &
  VariantProps<typeof progressVariants> & {
    hideTrack?: boolean;
    trackVariant?: VariantProps<typeof progressTrackVariants>["variant"];
  }) {
  return (
    <ProgressPrimitive.Root
      value={value}
      data-slot="progress"
      className={cn(progressVariants({ variant }), className)}
      {...props}
    >
      {children}
      {!hideTrack && (
        <ProgressTrack variant={trackVariant}>
          <ProgressIndicator />
        </ProgressTrack>
      )}
    </ProgressPrimitive.Root>
  );
}

const progressTrackVariants = cva(
  "relative flex h-2 w-full items-center overflow-x-hidden rounded-2xl",
  {
    variants: {
      variant: {
        default: "bg-muted",
        background: "bg-background",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function ProgressTrack({
  className,
  variant = "default",
  ...props
}: ProgressPrimitive.Track.Props & VariantProps<typeof progressTrackVariants>) {
  return (
    <ProgressPrimitive.Track
      className={cn(progressTrackVariants({ variant }), className)}
      data-slot="progress-track"
      {...props}
    />
  );
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      className={cn("h-full bg-primary transition-all", className)}
      {...props}
    />
  );
}

const progressLabelVariants = cva("text-sm", {
  variants: {
    variant: {
      default: "font-medium",
      muted: "font-normal text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function ProgressLabel({
  className,
  variant = "default",
  ...props
}: ProgressPrimitive.Label.Props & VariantProps<typeof progressLabelVariants>) {
  return (
    <ProgressPrimitive.Label
      className={cn(progressLabelVariants({ variant }), className)}
      data-slot="progress-label"
      {...props}
    />
  );
}

export { Progress, ProgressLabel };
