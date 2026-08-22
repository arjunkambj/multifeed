import { cn } from "@/lib/utils";

export default function Logo({
  className,
  markOnly = false,
  markClassName,
}: {
  className?: string;
  markOnly?: boolean;
  markClassName?: string;
}) {
  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-2 text-foreground transition-colors hover:text-primary",
        className,
      )}
    >
      <svg
        aria-label={markOnly ? "MultiFeed" : undefined}
        aria-hidden={!markOnly}
        className={cn("size-8 shrink-0", markClassName)}
        fill="none"
        role={markOnly ? "img" : undefined}
        viewBox="0 0 64 64"
      >
        <path
          d="M8 44 27 25M33 44l19-19v19"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="12"
        />
      </svg>
      {!markOnly && (
        <span className="font-display text-lg font-bold leading-none tracking-tight">
          MultiFeed
        </span>
      )}
    </div>
  );
}
