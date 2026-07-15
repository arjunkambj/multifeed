import Link from "next/link";

import Logo from "@/components/layout/Logo";

export function LegalPage({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Logo />
          <Link
            className="text-sm font-medium text-muted transition-colors hover:text-accent"
            href="/"
          >
            Back to home
          </Link>
        </header>

        <article className="py-12 sm:py-16">
          <p className="text-sm font-medium text-accent">
            Last updated July 15, 2026
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <div className="mt-10 space-y-8 text-base leading-7 text-muted [&_a]:text-accent [&_a]:underline [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2">
            {children}
          </div>
        </article>
      </div>
    </main>
  );
}
