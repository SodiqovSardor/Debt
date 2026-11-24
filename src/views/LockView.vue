<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useEventListener } from '@vueuse/core'
import { LogOut } from 'lucide-vue-next'
import BottomSheet from '../components/BottomSheet.vue'
import PinPad from '../components/PinPad.vue'
import { useSessionStore } from '../stores/session'
import type { PinSlotsState } from '../lib/pin'

const { t } = useI18n()

const router = useRouter()
const session = useSessionStore()

const pin = ref('')
const slotsState = ref<PinSlotsState>('idle')
const busy = ref(false)
const leaving = ref(false)
const error = ref<string | null>(null)
const lockedFor = ref(0)
const signOutOpen = ref(false)

const lockedOut = computed(() => lockedFor.value > 0)
const countdown = computed(() => formatTime(lockedFor.value))

let ticker: ReturnType<typeof setInterval> | null = null
let resetTimer: ReturnType<typeof setTimeout> | null = null
let submitTimer: ReturnType<typeof setTimeout> | null = null

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function syncLock(): void {
  lockedFor.value = session.remainingLock()
}

onMounted(() => {
  syncLock()
  // The lockout lives in storage, so poll it to keep the countdown moving.
  ticker = setInterval(syncLock, 250)
})

onBeforeUnmount(() => {
  if (ticker) clearInterval(ticker)
  if (resetTimer) clearTimeout(resetTimer)
  if (submitTimer) clearTimeout(submitTimer)
})

watch(pin, (value) => {
  if (value.length > 0 && !lockedOut.value) error.value = null
})

useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (event.key === 'Escape' && signOutOpen.value) signOutOpen.value = false
})

function scheduleSubmit(): void {
  if (submitTimer || busy.value || leaving.value || lockedOut.value) return
  // Let the fourth dot land before the code is checked.
  submitTimer = setTimeout(() => {
    submitTimer = null
    void submit()
  }, 140)
}

function resetWrong(): void {
  if (resetTimer) clearTimeout(resetTimer)
  resetTimer = setTimeout(() => {
    slotsState.value = 'idle'
    pin.value = ''
  }, 400)
}

async function submit(): Promise<void> {
  if (busy.value || leaving.value || lockedOut.value) return
  if (pin.value.length !== 4) return

  error.value = null
  busy.value = true

  try {
    const result = await session.unlockWithPin(pin.value)

    if (result === 'ok') {
      slotsState.value = 'correct'
      // Hold the sage borders for a beat, then fade the screen out over 240ms.
      window.setTimeout(() => {
        leaving.value = true
        window.setTimeout(() => {
          void router.replace({ name: 'home' })
        }, 240)
      }, 200)
      return
    }

    if (result === 'password-required') {
      await session.forgotPin()
      void router.replace({ name: 'login' })
      return
    }

    slotsState.value = 'wrong'
    if (result === 'locked') {
      syncLock()
      error.value = null
    } else {
      error.value = t('pin.wrong')
    }
    resetWrong()
  } catch {
    slotsState.value = 'wrong'
    error.value = t('pin.wrong')
    resetWrong()
  } finally {
    busy.value = false
  }
}

function pressBackspace(): void {
  pin.value = pin.value.slice(0, -1)
  error.value = null
}

async function pressForgot(): Promise<void> {
  await session.forgotPin()
  void router.replace({ name: 'login' })
}

async function confirmSignOut(): Promise<void> {
  signOutOpen.value = false
  await session.signOut()
  void router.replace({ name: 'login' })
}
</script>

<template>
  <div class="pin-page" :class="{ 'is-leaving': leaving }">
    <header class="pin-topbar">
      <span class="pin-topbar__title">{{ t('pin.title') }}</span>
      <button
        class="icon-btn pin-topbar__logout"
        type="button"
        :aria-label="t('pin.signOut')"
        @click="signOutOpen = true"
      >
        <LogOut :size="22" :stroke-width="1.75" aria-hidden="true" />
      </button>
    </header>

    <PinPad
      :value="pin"
      :state="slotsState"
      :disabled="busy || leaving || lockedOut || slotsState === 'wrong'"
      :dim="lockedOut"
      @update:value="pin = $event"
      @backspace="pressBackspace"
      @complete="scheduleSubmit"
    >
      <template #hint>
        <button
          v-if="!lockedOut"
          class="pin-hint"
          type="button"
          @click="pressForgot"
        >
          {{ t('pin.forgot') }}
        </button>
        <p v-else class="pin-hint pin-hint--static">
          {{ t('pin.lockedOut', { time: countdown }) }}
        </p>
      </template>

      <template #status>
        <span v-if="leaving" class="pin-ok">{{ t('pin.success') }}</span>
        <span v-else-if="busy">{{ t('pin.checking') }}</span>
        <span v-else-if="error" class="pin-error">{{ error }}</span>
      </template>
    </PinPad>

    <BottomSheet
      :open="signOutOpen"
      :title="t('pin.signOut')"
      :description="t('profile.signOutHint')"
      @close="signOutOpen = false"
    >
      <div class="sheet-actions">
        <button class="btn btn--ghost" type="button" @click="signOutOpen = false">
          {{ t('app.cancel') }}
        </button>
        <button class="btn btn--primary" type="button" @click="confirmSignOut">
          {{ t('pin.signOut') }}
        </button>
      </div>
    </BottomSheet>
  </div>
</template>

<style scoped>
.pin-error {
  color: var(--overdue);
}

.pin-ok {
  color: var(--paid);
}
</style>
