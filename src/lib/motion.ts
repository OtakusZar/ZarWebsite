import type { Transition, Variants } from 'framer-motion'

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1]
export const EASE_IN_OUT: [number, number, number, number] = [0.65, 0, 0.35, 1]

export const SPRING: Transition = { type: 'spring', stiffness: 460, damping: 30, mass: 0.7 }
export const SOFT_SPRING: Transition = { type: 'spring', stiffness: 220, damping: 26 }

/** Direction-aware slide used by the step switcher. */
export const stepVariants: Variants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 48 : -48,
    y: direction >= 0 ? 10 : -10,
  }),
  center: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.44, ease: EASE_OUT },
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -38 : 38,
    y: direction >= 0 ? -8 : 8,
    transition: { duration: 0.2, ease: EASE_IN_OUT },
  }),
}

export const stepVariantsReduced: Variants = {
  enter: { opacity: 0 },
  center: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT } },
}

export const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

export const itemFadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
}

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
  exit: { opacity: 0, scale: 0.97, y: -12, transition: { duration: 0.2 } },
}

/** Gentle horizontal shake for invalid submissions. */
export const shakeKeyframes = {
  x: [0, -12, 11, -8, 6, -3, 0],
}

export const shakeTransition: Transition = {
  duration: 0.5,
  ease: 'easeInOut',
  times: [0, 0.12, 0.28, 0.44, 0.6, 0.78, 1],
}
