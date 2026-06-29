"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <h2 className="text-2xl font-semibold">Something went wrong</h2>
      <p className="text-muted">{error.message}</p>
      <button onClick={reset} className="text-accent underline">
        Try again
      </button>
    </div>
  );
}
