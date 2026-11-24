<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PinPad from '../components/PinPad.vue'
import { useSessionStore } from '../stores/session'
import { isTrivialPin, type PinSlotsState } from '../lib/pin'

const { t } = useI18n()

const router = useRouter()
const session = useSessionStore()

const step = ref<'enter' | 'confirm'>('enter')
const pin = ref('')
const firstPin = ref('')
const slotsState = ref<PinSlotsState>('idle')
const busy = ref(false)
const error = ref<string | null>(null)

const isSetup = computed(() => step.value === 'enter')

let submitTimer: ReturnType<typeof setTimeout> | null = null
let resetTimer: ReturnType<typeof setTimeout> | null = null

watch(pin, (value) => {
  if (value.length > 0 && slotsState.value !== 'wrong') error.value = null
})

onBeforeUnmount(() => {
  if (submitTimer) clearTimeout(submitTimer)
  if (resetTimer) clearTimeout(resetTimer)
})

function scheduleSubmit(): void {
  if (submitTimer || busy.value || slotsState.value === 'wrong') return
  submitTimer = setTimeout(() => {
    submitTimer = null
    void submit()
  }, 140)
}

function wrongReset(message: string, restart = false): void {
  error.value = message
  slotsState.value = 'wrong'
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    slotsState.value = 'idle'
    pin.value = ''
    if (restart) {
      step.value = 'enter'
      firstPin.value = ''
    }
  }, 400)
}

async function submit(): Promise<void> {
  if (busy.value || pin.value.length !== 4) return

  if (isSetup.value) {
    if (isTrivialPin(pin.value)) {
      wrongReset(t('pin.trivial'))
      return
    }

    firstPin.value = pin.value
    pin.value = ''
    step.value = 'confirm'
    return
  }

  if (pin.value !== firstPin.value) {
    wrongReset(t('pin.mismatch'), true)
    return
  }

  error.value = null
  busy.value = true
  try {
    await session.setupPin(pin.value)
    void router.replace({ name: 'home' })
  } catch {
    wrongReset(t('pin.setupFailed'))
  } finally {
    busy.value = false
  }
}

function pressBackspace(): void {
  pin.value = pin.value.slice(0, -1)
  error.value = null
}
</script>

<template>
  <div class="pin-page">
    <header class="pin-topbar">
      <span class="pin-topbar__title">
        {{ isSetup ? t('pin.setupTitle') : t('pin.confirmTitle') }}
      </span>
    </header>

    <PinPad
      :value="pin"
      :state="slotsState"
      :disabled="busy || slotsState === 'wrong'"
      @update:value="pin = $event"
      @backspace="pressBackspace"
      @complete="scheduleSubmit"
    >
      <template #hint>
        <p class="pin-hint pin-hint--static">
          {{ isSetup ? t('pin.setupSubtitle') : t('pin.confirmSubtitle') }}
        </p>
      </template>

      <template #status>
        <span v-if="busy">{{ t('pin.checking') }}</span>
        <span v-else-if="error" class="pin-error">{{ error }}</span>
      </template>
    </PinPad>
  </div>
</template>

<style scoped>
.pin-error {
  color: var(--overdue);
}
</style>
