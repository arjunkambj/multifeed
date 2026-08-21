export default function Loading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <div
        aria-label="Loading"
        className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent"
        role="status"
      />
    </div>
  );
}
