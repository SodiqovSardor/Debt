<script setup lang="ts">
import { motion } from 'motion-v'
import { useI18n } from 'vue-i18n'
import type { PinSlotsState } from '../lib/pin'

const { t } = useI18n()

withDefaults(
  defineProps<{
    count: number
    state?: PinSlotsState
    pulse?: boolean
  }>(),
  { state: 'idle', pulse: true },
)

const slots = [0, 1, 2, 3]
</script>

<template>
  <div
    class="pin-slots"
    :class="`pin-slots--${state}`"
    role="img"
    :aria-label="t('pin.progress', { count })"
  >
    <span
      v-for="index in slots"
      :key="index"
      class="pin-slot"
      :class="{
        'pin-slot--filled': index < count,
        'pin-slot--active': pulse && state === 'idle' && index === count,
      }"
    >
      <motion.span
        v-if="index < count"
        class="pin-slot__dot"
        :initial="{ scale: 0.2, opacity: 0 }"
        :animate="{ scale: 1, opacity: 1 }"
        :transition="{ type: 'spring', stiffness: 520, damping: 26 }"
      />
    </span>
  </div>
</template>

<style scoped>
.pin-slots {
  display: flex;
  justify-content: center;
  gap: 20px;
}

.pin-slot {
  display: grid;
  width: 68px;
  height: 128px;
  place-items: center;
  background: var(--surface);
  border: 2px solid color-mix(in srgb, var(--text) 14%, transparent);
  border-radius: var(--radius-pill);
  transition: border-color 200ms var(--ease-out);
}

.pin-slot--active {
  border-color: var(--accent);
  animation: pin-slot-pulse 1.6s ease-in-out infinite;
}

.pin-slots--wrong .pin-slot {
  border-color: var(--overdue);
}

.pin-slots--correct .pin-slot {
  border-color: var(--paid);
}

.pin-slot__dot {
  width: 14px;
  height: 14px;
  background: var(--text);
  border-radius: 50%;
}

.pin-slots--wrong {
  animation: pin-slot-shake 400ms var(--ease-out);
}

@keyframes pin-slot-pulse {
  0%,
  100% {
    border-color: var(--accent);
  }

  50% {
    border-color: color-mix(in srgb, var(--accent) 42%, transparent);
  }
}

@keyframes pin-slot-shake {
  0%,
  100% {
    transform: translateX(0);
  }

  20% {
    transform: translateX(-8px);
  }

  40% {
    transform: translateX(8px);
  }

  60% {
    transform: translateX(-8px);
  }

  80% {
    transform: translateX(8px);
  }
}

@media (min-width: 600px) {
  .pin-slot {
    width: 80px;
    height: 148px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pin-slot--active,
  .pin-slots--wrong {
    animation: none;
  }
}
</style>
