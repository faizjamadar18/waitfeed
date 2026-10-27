import type { Transition, Variants } from "motion/react";

/**
 * Exact Framer Motion animation constants extracted from https://relace.ai/old
 *
 * Core easing curve: cubic-bezier(0.6, 0, 0.05, 1)
 * Standard duration: 0.6s
 * Standard enter offset: y: 20px, opacity: 0 -> 1
 */
export const RELACE_EASE = [0.6, 0, 0.05, 1] as const;
export const RELACE_DURATION = 0.6;

export const defaultTransition: Transition = {
  duration: RELACE_DURATION,
  ease: RELACE_EASE,
};

export const transitionWithDelay = (delay: number): Transition => ({
  duration: RELACE_DURATION,
  ease: RELACE_EASE,
  delay,
});

// Viewport trigger settings matching Relace's scroll target threshold
export const relaceViewport = {
  once: true,
  margin: "-80px" as const,
};

// Fade up text variant (used for headers, titles, overlines, paragraphs)
export const fadeUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: RELACE_DURATION,
      ease: RELACE_EASE,
      delay,
    },
  }),
};

// Scale & fade variant (used for cards, visuals, preview windows)
export const scaleUpVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 16,
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: RELACE_DURATION + 0.1,
      ease: RELACE_EASE,
      delay,
    },
  }),
};

// Container stagger variants for grid & lists
export const staggerContainerVariants = (
  staggerChildren: number = 0.07,
  delayChildren: number = 0.05
): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
});

export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: RELACE_DURATION,
      ease: RELACE_EASE,
    },
  },
};
