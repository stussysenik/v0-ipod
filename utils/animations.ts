import type { Variants } from "framer-motion"

export const buttonPressAnimation: Variants = {
  rest: { scale: 1 },
  pressed: { scale: 0.95 },
}

export const progressBarAnimation: Variants = {
  initial: { scaleX: 0 },
  animate: {
    scaleX: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
}

export const textFadeAnimation: Variants = {
  initial: { opacity: 0, y: 5 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -5,
    transition: { duration: 0.2, ease: "easeIn" },
  },
}
