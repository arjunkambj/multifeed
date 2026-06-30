import type React from "react";
import Link from "next/link";

import Logo from "@/components/layout/Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="absolute left-5 top-5 sm:left-8 sm:top-8">
        <HomeLink />
      </div>

      <main className="flex flex-1 items-center justify-center px-5 py-20 sm:px-8">
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
