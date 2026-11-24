/**
 * Every JS-driven duration, ease, and spring lives here so the motion system
 * can be tuned without hunting through components.
 */

export const springTab = { type: 'spring', stiffness: 380, damping: 32 } as const

export const springSheet = { type: 'spring', stiffness: 320, damping: 34, mass: 0.9 } as const

export const fadeTab = { duration: 0.18, ease: 'easeOut' } as const

export const routeMotion = { duration: 0.26, ease: 'easeOut' } as const

export const countUp = { duration: 0.9, ease: 'expo.out' } as const

export const checkDraw = { duration: 0.35, ease: 'power2.out' } as const

export const donutSweep = { duration: 0.6, stagger: 0.08, ease: 'power2.out' } as const

export const stagger = { step: 0.04, duration: 0.32, distance: 12 } as const

export function listItem(index: number) {
  return {
    initial: { opacity: 0, y: stagger.distance },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: stagger.duration,
      delay: index * stagger.step,
      ease: 'easeOut',
    },
  }
}
