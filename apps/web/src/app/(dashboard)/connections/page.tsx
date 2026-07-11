import { Suspense } from "react";
import { Spinner } from "@heroui/react";
import { ConnectionsPage } from "@/components/connections/ConnectionsPage";

function ConnectionsLoading() {
  return (
    <div
      className="flex min-h-52 flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Spinner color="accent" size="lg" />
      <p className="text-sm text-muted">Loading connections…</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<ConnectionsLoading />}>
      <ConnectionsPage />
    </Suspense>
  );
}
