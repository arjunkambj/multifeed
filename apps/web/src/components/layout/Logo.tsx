interface LogoProps {
  className?: string
  markOnly?: boolean
}

export default function Logo({ className, markOnly = false }: LogoProps) {
  return (
    <div
      className={`group flex cursor-pointer items-center gap-2.5 text-foreground transition-colors hover:text-accent${className ? ` ${className}` : ""}`}
    >
      <svg
        aria-hidden="true"
        className="h-7 w-7 shrink-0 text-current transition-colors"
        fill="none"
        viewBox="0 0 40 40"
      >
        <path
          d="M6 4L18 10V26C18 29.3137 15.3137 32 12 32C8.68629 32 6 29.3137 6 26V4Z"
          fill="currentColor"
        />
        <path d="M22 14H34V24L22 30V14Z" fill="currentColor" />
      </svg>
      {!markOnly && (
        <span className="text-lg font-display font-bold tracking-tight">
          Unifeed
        </span>
      )}
    </div>
  )
}
