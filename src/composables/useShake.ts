import { ref } from 'vue'
import gsap from 'gsap'

/**
 * Triggers a brief horizontal shake on the target element. Used for wrong-PIN
 * feedback. Respects reduced motion by skipping the transform.
 */
export function useShake() {
  const shaking = ref(false)

  function shake(target: HTMLElement | null, distance = 8, duration = 0.4): void {
    if (!target || shaking.value) return
    shaking.value = true

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      shaking.value = false
      return
    }

    gsap.killTweensOf(target)
    gsap.to(target, {
      x: [-distance, distance, -distance, distance, 0] as unknown as number,
      duration,
      ease: 'power1.inOut',
      onComplete: () => {
        gsap.set(target, { x: 0 })
        shaking.value = false
      },
    })
  }

  return { shaking, shake }
}
