<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import gsap from 'gsap'
import { usePreferredReducedMotion } from '@vueuse/core'
import { donutSweep } from '../motion/presets'
import { formatCompactAmount, formatCurrencyUnit, formatPercent, formatUZS } from '../utils/format'
import type { DebtGroup } from '../types/debt'

const { t } = useI18n()

const props = defineProps<{ groups: DebtGroup[] }>()

const host = ref<HTMLElement | null>(null)
const revealed = ref(false)
const reducedMotion = usePreferredReducedMotion()
let observer: IntersectionObserver | null = null

interface Segment {
  person: string
  amount: number
  share: number
  offset: number
  color: string
  dash: string
}

const total = computed(() => props.groups.reduce((sum, group) => sum + group.outstanding, 0))

const segments = computed<Segment[]>(() => {
  let offset = 0
  return props.groups
    .filter((group) => group.outstanding > 0)
    .map((group, index) => {
      const share = total.value > 0 ? (group.outstanding / total.value) * 100 : 0
      const visible = Math.max(share - 0.8, 0.4)
      const segment: Segment = {
        person: group.person,
        amount: group.outstanding,
        share,
        offset,
        color: `var(--chart-${(index % 6) + 1})`,
        dash: `${visible} ${100 - visible}`,
      }
      offset += share
      return segment
    })
})

const totalLabel = computed(() => formatCompactAmount(total.value))
const currencyUnit = computed(() => formatCurrencyUnit())
const chartLabel = computed(() => {
  const segmentsText = segments.value
    .map((segment) => `${segment.person} ${formatPercent(segment.share)}`)
    .join(', ')
  return t('insights.chartLabel', { total: formatUZS(total.value), segments: segmentsText })
})

function circles(): SVGCircleElement[] {
  return Array.from(host.value?.querySelectorAll<SVGCircleElement>('[data-segment]') ?? [])
}

function killTweens(): void {
  for (const circle of circles()) gsap.killTweensOf(circle)
}

function applyFinal(): void {
  for (const circle of circles()) {
    const dash = circle.dataset.dash
    if (dash) gsap.set(circle, { attr: { 'stroke-dasharray': dash } })
  }
}

function reveal(): void {
  if (revealed.value) return
  revealed.value = true

  if (reducedMotion.value === 'reduce') {
    applyFinal()
    return
  }

  circles().forEach((circle, index) => {
    const dash = circle.dataset.dash
    if (!dash) return
    gsap.fromTo(
      circle,
      { attr: { 'stroke-dasharray': '0 100' } },
      {
        attr: { 'stroke-dasharray': dash },
        duration: donutSweep.duration,
        delay: index * donutSweep.stagger,
        ease: donutSweep.ease,
      },
    )
  })
}

onMounted(() => {
  if (!host.value) return
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        reveal()
        observer?.disconnect()
        observer = null
      }
    },
    { threshold: 0.25 },
  )
  observer.observe(host.value)
})

watch(segments, async () => {
  if (!revealed.value) return
  await nextTick()
  killTweens()
  applyFinal()
})

onBeforeUnmount(() => {
  observer?.disconnect()
  killTweens()
})
</script>

<template>
  <div class="donut-layout">
    <div v-if="segments.length" ref="host" class="donut" role="img" :aria-label="chartLabel">
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <circle
          class="donut__track"
          cx="21"
          cy="21"
          r="15.9155"
          fill="none"
          stroke="var(--hairline)"
          stroke-width="5"
        />
        <circle
          v-for="segment in segments"
          :key="segment.person"
          data-segment
          :data-dash="segment.dash"
          :stroke="segment.color"
          :stroke-dasharray="'0 100'"
          :stroke-dashoffset="-segment.offset"
          cx="21"
          cy="21"
          r="15.9155"
          fill="none"
          stroke-width="5"
          pathLength="100"
        />
      </svg>
      <div class="donut__center">
        <span>{{ t('insights.outstanding') }}</span>
        <strong class="amount">{{ totalLabel }}</strong>
        <span class="donut__unit">{{ currencyUnit }}</span>
      </div>
    </div>
    <p v-else class="empty-state">{{ t('insights.emptyChart') }}</p>

    <ul v-if="segments.length" class="donut-legend">
      <li v-for="segment in segments" :key="segment.person">
        <span
          class="donut-legend__swatch"
          :style="{ background: segment.color }"
          aria-hidden="true"
        />
        <span class="donut-legend__person">{{ segment.person }}</span>
        <span class="donut-legend__amount amount">
          {{ formatUZS(segment.amount) }}
        </span>
        <span class="donut-legend__share">{{ formatPercent(segment.share) }}</span>
      </li>
    </ul>
  </div>
</template>
