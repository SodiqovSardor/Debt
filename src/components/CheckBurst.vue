<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { usePreferredReducedMotion } from '@vueuse/core'
import { checkDraw } from '../motion/presets'

const props = defineProps<{ active: boolean }>()

const path = ref<SVGPathElement | null>(null)
const reducedMotion = usePreferredReducedMotion()

function draw(): void {
  const element = path.value
  if (!element) return
  gsap.killTweensOf(element)
  if (reducedMotion.value === 'reduce') {
    gsap.set(element, { strokeDashoffset: 0 })
    return
  }
  gsap.fromTo(
    element,
    { strokeDashoffset: 1 },
    { strokeDashoffset: 0, duration: checkDraw.duration, ease: checkDraw.ease },
  )
}

watch(
  () => props.active,
  (active) => {
    if (active) draw()
  },
  { immediate: true, flush: 'post' },
)

onMounted(() => {
  if (props.active) draw()
})

onBeforeUnmount(() => {
  if (path.value) gsap.killTweensOf(path.value)
})
</script>

<template>
  <svg class="check-burst" viewBox="0 0 16 16" aria-hidden="true">
    <path
      ref="path"
      d="M3 8.4 6.2 11.6 13 4.4"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      pathLength="1"
      stroke-dasharray="1"
      stroke-dashoffset="1"
    />
  </svg>
</template>
