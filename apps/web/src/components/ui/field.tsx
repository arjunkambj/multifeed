import type { ComponentProps } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    />
  );
}

function Field({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="field"
      className={cn(
        "group/field flex w-full flex-col gap-1.5 data-[invalid=true]:text-destructive",
        className,
      )}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("group-data-[disabled=true]/field:opacity-50", className)}
      {...props}
    />
  );
}

export { Field, FieldGroup, FieldLabel };
