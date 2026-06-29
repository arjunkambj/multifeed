export const revealContainerVariants = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
  initial: {},
};

export const revealItemVariants = {
  animate: {
    opacity: 1,
    transition: { duration: 0.6, ease: "easeInOut" as const },
    y: 0,
  },
  initial: { opacity: 0, y: 30 },
};

export const revealCardVariants = {
  animate: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: "easeInOut" as const },
    y: 0,
  },
  initial: { opacity: 0, scale: 0.95, y: 30 },
};

export const revealViewport = { amount: 0.3, once: true } as const;
