<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Delete } from 'lucide-vue-next'
import PinSlots from './PinSlots.vue'
import type { PinSlotsState } from '../lib/pin'
import { haptic } from '../utils/haptics'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    value: string
    state?: PinSlotsState
    maxLength?: number
    disabled?: boolean
    dim?: boolean
  }>(),
  {
    state: 'idle',
    maxLength: 4,
    disabled: false,
    dim: false,
  },
)

const emit = defineEmits<{
  'update:value': [value: string]
  backspace: []
  complete: []
}>()

const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

function pressDigit(digit: string): void {
  // A fifth digit is ignored: the code is exactly four digits long.
  if (props.disabled || props.value.length >= props.maxLength) return

  haptic()
  const next = props.value + digit
  emit('update:value', next)
  if (next.length === props.maxLength) emit('complete')
}

function pressBackspace(): void {
  if (props.disabled || props.value.length === 0) return
  haptic()
  emit('backspace')
}

function onKeydown(event: KeyboardEvent): void {
  if (props.disabled || event.metaKey || event.ctrlKey || event.altKey) return

  const target = event.target
  if (
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  ) {
    return
  }

  if (/^\d$/.test(event.key)) {
    event.preventDefault()
    pressDigit(event.key)
    return
  }

  if (event.key === 'Backspace') {
    event.preventDefault()
    pressBackspace()
    return
  }

  if (event.key === 'Enter' && props.value.length === props.maxLength) {
    event.preventDefault()
    emit('complete')
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="pinpad" role="group" :aria-label="t('pin.keypad')">
    <div class="pinpad__display">
      <PinSlots :count="value.length" :state="state" :pulse="!disabled && !dim" />

      <div class="pinpad__hint">
        <slot name="hint" />
      </div>

      <div class="pinpad__status" aria-live="polite" aria-atomic="true">
        <slot name="status" />
      </div>
    </div>

    <!-- Biometric unlock (WebAuthn or Capacitor) would sit between the hint and the keypad. -->

    <div class="pinpad__keys" :class="{ 'is-dim': dim }">
      <button
        v-for="digit in digits"
        :key="digit"
        class="pinpad__key"
        type="button"
        :disabled="disabled"
        :aria-label="t('pin.digit', { digit })"
        @click="pressDigit(digit)"
      >
        {{ digit }}
      </button>

      <span class="pinpad__blank" aria-hidden="true" />

      <button
        class="pinpad__key"
        type="button"
        :disabled="disabled"
        :aria-label="t('pin.digit', { digit: '0' })"
        @click="pressDigit('0')"
      >
        0
      </button>

      <button
        class="pinpad__key"
        type="button"
        :disabled="disabled"
        :aria-label="t('pin.backspace')"
        @click="pressBackspace"
      >
        <Delete :size="24" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.pinpad {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-direction: column;
  padding-bottom: max(24px, env(safe-area-inset-bottom));
}

.pinpad__display {
  display: flex;
  margin-top: 96px;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.pinpad__hint {
  display: flex;
  justify-content: center;
  width: 100%;
}

.pinpad__status {
  min-height: 20px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.pinpad__keys {
  display: grid;
  width: 100%;
  max-width: 420px;
  margin: auto auto 0;
  padding: 0 8px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  transition: opacity 240ms var(--ease-out);
}

.pinpad__keys.is-dim {
  opacity: 0.4;
}

.pinpad__key {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 72px;
  padding: 0;
  place-items: center;
  overflow: hidden;
  background: transparent;
  border: 0;
  border-radius: 16px;
  color: var(--text);
  font-family: var(--sans);
  font-size: 30px;
  font-weight: 500;
  cursor: pointer;
  touch-action: manipulation;
}

/* Soft circular ripple: transform and opacity only. */
.pinpad__key::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 64px;
  height: 64px;
  margin: -32px 0 0 -32px;
  background: var(--text);
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.4);
  transition: transform 300ms var(--ease-out), opacity 300ms var(--ease-out);
  pointer-events: none;
}

.pinpad__key:active::after {
  opacity: 0.07;
  transform: scale(1);
}

.pinpad__key:disabled {
  cursor: not-allowed;
}

.pinpad__blank {
  display: block;
}

@media (max-width: 599px) and (max-height: 700px) {
  .pinpad__display {
    margin-top: 40px;
    gap: 16px;
  }

  .pinpad__key {
    min-height: 64px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pinpad__key::after,
  .pinpad__keys {
    transition: none;
  }
}
</style>
