import { Suspense } from "react";
import { Spinner } from "@heroui/react";
import { SelectAccountPage } from "@/components/connections/SelectAccountPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-40 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <SelectAccountPage />
    </Suspense>
  );
}
