"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16">
      <h2 className="text-xl font-semibold">Could not load this page</h2>
      <p className="text-sm text-muted-foreground">Please try again.</p>
      {error.digest ? (
        <p className="text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}
      <button onClick={reset} className="text-primary underline">
        Try again
      </button>
    </div>
  );
}
