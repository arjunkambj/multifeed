import Link from "next/link";

import Logo from "@/components/layout/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <header className="absolute inset-x-0 top-0 z-10 flex h-14 items-center px-4 sm:px-6">
        <Link href="/" className="inline-flex">
          <Logo className="gap-2" />
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-20 sm:px-6 sm:py-24">
        {children}
      </main>
    </div>
  );
}
