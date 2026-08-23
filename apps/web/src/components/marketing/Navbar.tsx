"use client";

import Logo from "@/components/layout/Logo";
import { buttonVariants } from "@/components/ui/button";
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

function hasPassedHeroMock() {
  const mock = document.getElementById("hero-mock");
  if (!mock) return false;
  return mock.getBoundingClientRect().bottom <= 64;
}

export function Navbar() {
  const [activeSection, setActiveSection] = useState("hero");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", () => {
    const next = hasPassedHeroMock();
    setIsScrolled((prev) => (prev === next ? prev : next));
  });

  useEffect(() => {
    const next = hasPassedHeroMock();
    setIsScrolled((prev) => (prev === next ? prev : next));
  }, []);

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
      className={cn(
        "sticky z-50 mx-auto rounded-2xl backdrop-blur-lg transition-[width,background-color,transform] duration-300",
        isScrolled
          ? "top-1.5 mt-1.5 w-[min(42rem,calc(100%-0.75rem))] translate-y-1 bg-card/95 sm:top-2 sm:mt-2 sm:w-[min(42rem,calc(100%-2rem))] dark:bg-card/80"
          : "top-1.5 mt-1.5 w-[min(80rem,calc(100%-0.75rem))] bg-background/95 sm:top-3 sm:mt-3 sm:w-[min(80rem,calc(100%-2rem))]",
      )}
    >
      <nav className="flex h-11 w-full items-center justify-between gap-4 px-2.5 sm:h-14 sm:gap-6 sm:px-6">
        <div className="justify-self-start">
          <Logo markOnly markClassName="size-7 sm:size-8" />
        </div>

        <ul className="hidden items-center justify-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.slice(1);
            return (
              <li key={link.name}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "block rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
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
          <button
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            className="inline-flex size-8 items-center justify-center text-foreground outline-none lg:hidden focus-visible:ring-3 focus-visible:ring-ring/30"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            <Icon icon={isMenuOpen ? "ph:x" : "ph:list"} width={18} />
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="border-t border-border/50 px-2 pb-2 lg:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.slice(1);
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary",
                  )}
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
            className={cn(buttonVariants(), "mt-3 w-full justify-center")}
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
