import { Icon } from "@iconify/react";

export default function Loading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <Icon icon="svg-spinners:180-ring-with-bg" className="size-6 text-accent" />
    </div>
  );
}
