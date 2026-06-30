"use client";

import { buttonVariants } from "@heroui/react";
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
  { href: "#hero", name: "Home" },
  { href: "#features", name: "Features" },
  { href: "#pricing", name: "Pricing" },
] as const;

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
          className="hidden items-center gap-10 sm:flex"
          variants={{
            animate: { transition: { staggerChildren: 0.08 } },
            initial: {},
          }}
        >
          {navLinks.map((link) => (
            <motion.li
              className="text-sm font-medium hover:cursor-pointer hover:text-accent"
              key={link.name}
              variants={navItemVariants}
            >
              <Link href={link.href}>{link.name}</Link>
            </motion.li>
          ))}
        </motion.ul>
        <motion.div variants={navItemVariants}>
          <Link
            className={`${buttonVariants({ size: "sm" })} button`}
            href="/sign-in"
          >
            Get Started
          </Link>
        </motion.div>
      </nav>
    </motion.div>
  );
}
