import { cn } from "@/lib/utils";
import { Spinner as SpinnerIcon } from "@honeyicons/react";

function Spinner({
  className,
  ...props
}: Omit<React.ComponentProps<"svg">, "strokeWidth">) {
  return (
    <SpinnerIcon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
