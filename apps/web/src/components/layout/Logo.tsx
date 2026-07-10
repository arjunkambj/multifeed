export default function Logo({
  className,
  markOnly = false,
}: {
  className?: string;
  markOnly?: boolean;
}) {
  return (
    <div
      className={`group flex cursor-pointer items-center gap-2 text-foreground transition-colors hover:text-accent${className ? ` ${className}` : ""}`}
    >
      <svg
        aria-label={markOnly ? "Multi Feed" : undefined}
        aria-hidden={!markOnly}
        className="size-8 -translate-y-px shrink-0"
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
          Multi Feed
        </span>
      )}
    </div>
  );
}
