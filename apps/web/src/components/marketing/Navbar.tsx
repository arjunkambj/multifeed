"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import Logo from "@/components/layout/Logo";

const navLinks = [
  { href: "#features", name: "Features" },
  { href: "#why-multifeed", name: "How it works" },
  { href: "#pricing", name: "Pricing" },
  { href: "#faq", name: "FAQ" },
] as const;

export function Navbar() {
  const [activeSection, setActiveSection] = useState("hero");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const sectionIds = ["hero", ...navLinks.map(({ href }) => href.slice(1))];
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);

      const currentSection =
        [...sectionIds].reverse().find((id) => {
          const section = document.getElementById(id);
          return section ? section.getBoundingClientRect().top <= 120 : false;
        }) ?? "hero";

      setActiveSection(currentSection);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  return (
    <header
      className={`rounded-2xl sticky z-50 mx-auto backdrop-blur-lg transition-all duration-300 ${
        isScrolled
          ? "top-2 mt-2 w-[min(42rem,calc(100%-2rem))] translate-y-1 bg-card/95 dark:bg-card/80"
          : "top-3 mt-3 w-[min(80rem,calc(100%-2rem))] bg-background/95"
      }`}
    >
      <nav className="flex h-14 w-full items-center justify-between gap-6 px-5 sm:px-6">
        <div className="justify-self-start">
          <Logo markOnly />
        </div>

        <ul className="hidden items-center justify-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.slice(1);
            return (
              <li key={link.name}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`block rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                  href={link.href}
                >
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          <Link
            className={`${buttonVariants()} hidden lg:inline-flex`}
            href="/sign-in"
          >
            Get started
          </Link>
          <Button
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            className="lg:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            size="icon-lg"
            type="button"
            variant="outline"
          >
            <Icon icon={isMenuOpen ? "ph:x" : "ph:list"} width={18} />
          </Button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="border-t border-border/50 px-3 pb-3 lg:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.slice(1);
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                  href={link.href}
                  key={link.name}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>
          <Link
            className={`${buttonVariants()} mt-3 w-full justify-center`}
            href="/sign-in"
            onClick={() => setIsMenuOpen(false)}
          >
            Get started
          </Link>
        </div>
      )}
    </header>
  );
}
