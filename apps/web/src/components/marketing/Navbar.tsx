"use client";

import Logo from "@/components/layout/Logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import { useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "#features", name: "Features" },
  { href: "#why-multifeed", name: "How it works" },
  { href: "#pricing", name: "Pricing" },
  { href: "#faq", name: "FAQ" },
] as const;

const sectionIds = ["hero", ...navLinks.map(({ href }) => href.slice(1))];

export function Navbar() {
  const [activeSection, setActiveSection] = useState("hero");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const next = latest > 8;
    setIsScrolled((prev) => (prev === next ? prev : next));
  });

  useEffect(() => {
    const ratios = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio);
        }

        let next = "hero";
        let best = 0;
        for (const id of sectionIds) {
          const ratio = ratios.get(id) ?? 0;
          if (ratio > best) {
            best = ratio;
            next = id;
          }
        }
        setActiveSection((prev) => (prev === next ? prev : next));
      },
      {
        rootMargin: "-18% 0px -62% 0px",
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    );

    for (const id of sectionIds) {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    }

    return () => observer.disconnect();
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
      className={`rounded-2xl sticky z-50 mx-auto backdrop-blur-lg transition-[width,background-color,transform] duration-300 ${
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
            className={cn(buttonVariants(), "hidden lg:inline-flex")}
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
