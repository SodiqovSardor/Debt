import { onBeforeUnmount, ref, watch, type Ref } from 'vue'
import gsap from 'gsap'
import { usePreferredReducedMotion } from '@vueuse/core'
import { countUp } from '../motion/presets'

/** Survives tab unmounts so a return to Home counts from where it left off. */
const lastValues = new Map<string, number>()

/**
 * Animates a number toward the reactive source with GSAP. The display starts
 * at the previous value (0 on first load), not at the target, so the hero
 * always performs a visible count-up.
 */
export function useCountUp(source: Ref<number>, key = 'hero-total') {
  const reducedMotion = usePreferredReducedMotion()
  const initial = reducedMotion.value === 'reduce' ? source.value : (lastValues.get(key) ?? 0)
  const display = ref(initial)
  let tween: gsap.core.Tween | null = null

  function settle(value: number): void {
    tween?.kill()
    tween = null
    display.value = value
    lastValues.set(key, value)
  }

  watch(
    source,
    (target) => {
      if (reducedMotion.value === 'reduce') {
        settle(target)
        return
      }

      tween?.kill()
      const state = { value: display.value }
      tween = gsap.to(state, {
        value: target,
        duration: countUp.duration,
        ease: countUp.ease,
        onUpdate: () => {
          display.value = state.value
          lastValues.set(key, state.value)
        },
        onComplete: () => {
          display.value = target
          lastValues.set(key, target)
          tween = null
        },
      })
    },
    { immediate: true },
  )

  watch(reducedMotion, (preference) => {
    if (preference === 'reduce') settle(source.value)
  })

  onBeforeUnmount(() => {
    tween?.kill()
    tween = null
  })

  return display
}
