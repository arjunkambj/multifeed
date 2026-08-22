"use client";

export function SupportSettingsPanel() {
  return (
    <div className="flex max-w-xl flex-col gap-3 rounded-2xl bg-muted p-5">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Need help with posting, billing, or your workspace? Reach out and
        we&apos;ll get you unstuck.
      </p>
      <a
        className="text-sm font-medium text-primary hover:underline"
        href="mailto:support@themultifeed.com"
      >
        support@themultifeed.com
      </a>
    </div>
  );
}
