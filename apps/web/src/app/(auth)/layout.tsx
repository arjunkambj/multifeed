import type React from "react";
import Link from "next/link";

import Logo from "@/components/layout/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh bg-background flex flex-col p-2 lg:p-4 lg:grid lg:grid-cols-2">
      <aside className="relative hidden h-full overflow-hidden rounded-3xl bg-gradient-to-br from-accent/[0.025] via-surface to-accent/[0.035] text-foreground lg:flex">
        <div className="relative flex w-full flex-col p-6">
          <HomeLink />
        </div>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-2 py-2 sm:px-8 sm:py-10 lg:px-12">
        <div className="absolute left-1/2 top-4 -translate-x-1/2 lg:hidden">
          <HomeLink />
        </div>

        {children}
      </main>
    </div>
  );
}

function HomeLink() {
  return (
    <Link href="/">
      <Logo className="gap-2" />
    </Link>
  );
}
