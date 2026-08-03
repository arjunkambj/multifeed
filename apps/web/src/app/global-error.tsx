"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background font-sans text-foreground">
        <h2 className="text-2xl font-semibold">Something went wrong</h2>
        <p className="text-muted">An unexpected error occurred.</p>
        {error.digest ? (
          <p className="text-xs text-muted">Reference: {error.digest}</p>
        ) : null}
        <button onClick={() => reset()} className="text-accent underline">
          Try again
        </button>
      </body>
    </html>
  );
}
