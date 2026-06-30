"use client";

import { buttonVariants } from "@heroui/react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import Logo from "@/components/layout/Logo";

const navVariants = {
  animate: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeInOut" as const },
    y: 0,
  },
  initial: { opacity: 0, y: -20 },
};

const navItemVariants = {
  animate: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeInOut" as const },
    y: 0,
  },
  initial: { opacity: 0, y: -10 },
};

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
    if (!isMenuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  return (
    <motion.div
      className={`marketing-nav sticky top-3 z-50 mx-4 mt-4 border border-border/50 backdrop-blur-lg transition-colors duration-300 dark:shadow-lg dark:shadow-black/20 sm:mx-auto sm:w-[min(64rem,calc(100%-2rem))] ${
        isScrolled ? "bg-white/50 dark:bg-surface/75" : "bg-surface"
      }`}
      initial="initial"
      variants={navVariants}
      viewport={{ once: true }}
      whileInView="animate"
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between bg-transparent px-4 py-3">
        <motion.div variants={navItemVariants}>
          <Logo />
        </motion.div>
        <motion.ul
          className="hidden items-center gap-1 sm:flex"
          variants={{
            animate: { transition: { staggerChildren: 0.08 } },
            initial: {},
          }}
        >
          {navLinks.map((link) => (
            <motion.li key={link.name} variants={navItemVariants}>
              <Link
                aria-current={
                  activeSection === link.href.slice(1) ? "page" : undefined
                }
                className={`marketing-chip block px-3 py-2 text-sm font-medium transition-colors hover:text-accent ${
                  activeSection === link.href.slice(1)
                    ? "text-accent"
                    : "text-muted"
                }`}
                href={link.href}
              >
                {link.name}
              </Link>
            </motion.li>
          ))}
        </motion.ul>
        <motion.div
          className="hidden items-center gap-2 sm:flex"
          variants={navItemVariants}
        >
          <Link
            className={`${buttonVariants({ size: "sm" })} button`}
            href="/sign-in"
          >
            Get Started
          </Link>
        </motion.div>
        <motion.button
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation"
          className="button inline-flex size-9 items-center justify-center border border-border/60 bg-surface text-foreground transition-colors hover:border-accent/40 hover:text-accent sm:hidden"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
          variants={navItemVariants}
        >
          <Icon icon={isMenuOpen ? "ph:x" : "ph:list"} width={18} />
        </motion.button>
      </nav>
      {isMenuOpen && (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border/50 px-2 pb-2 sm:hidden"
          initial={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <Link
                aria-current={
                  activeSection === link.href.slice(1) ? "page" : undefined
                }
                className={`marketing-chip px-3 py-2 text-sm font-medium transition-colors ${
                  activeSection === link.href.slice(1)
                    ? "text-accent"
                    : "text-muted hover:text-accent"
                }`}
                href={link.href}
                key={link.name}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link
              className={`${buttonVariants({ size: "sm" })} button mt-1`}
              href="/sign-in"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
