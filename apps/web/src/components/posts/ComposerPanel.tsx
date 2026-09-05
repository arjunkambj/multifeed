import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ComposerPanel({
  children,
  id,
  open,
}: {
  children: ReactNode;
  id: string;
  open: boolean;
}) {
  return (
    <div
      id={id}
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "-mx-1 grid transition-[grid-template-rows,opacity] duration-200 ease-in-out motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex flex-col gap-4 px-1 pt-4 pb-1">{children}</div>
      </div>
    </div>
  );
}
