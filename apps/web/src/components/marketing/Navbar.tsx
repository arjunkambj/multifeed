"use client";

import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useEffect, useState } from "react";

import Logo from "@/components/layout/Logo";

const navLinks = [
  { href: "#features", name: "Features" },
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
      className={`rounded-2xl sticky top-2 z-50 mx-auto mt-2 w-[min(48rem,calc(100%-2rem))] border border-border/50 backdrop-blur-lg transition-colors duration-300 dark:shadow-lg dark:shadow-black/20 ${
        isScrolled ? "bg-white/55 dark:bg-card/80" : "bg-card/95"
      }`}
      data-gsap-nav
    >
      <nav className="grid h-14 w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-5">
        <div className="justify-self-start">
          <Logo />
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
            className={`${buttonVariants({ size: "sm" })} hidden lg:inline-flex`}
            href="/sign-in"
          >
            Plan a post
          </Link>
          <button
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
            className=" inline-flex size-9 items-center justify-center border border-border/60 bg-card text-foreground transition-colors hover:border-primary/40 hover:text-primary lg:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            type="button"
          >
            <Icon icon={isMenuOpen ? "ph:x" : "ph:list"} width={18} />
          </button>
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
                    isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
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
            Plan a post
          </Link>
        </div>
      )}
    </header>
  );
}
