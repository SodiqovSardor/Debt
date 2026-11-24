<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { MotionConfig } from 'motion-v'
import { useAutoLock } from './composables/useAutoLock'
import { useSessionStore } from './stores/session'
import { useUiStore } from './stores/ui'

useAutoLock(true)

const router = useRouter()
const session = useSessionStore()
const ui = useUiStore()

/**
 * Locks can happen without a navigation (idle timer, long background). The
 * route guard only runs on navigation, so this watchdog sends the user to the
 * PIN screen and drops any open sheets.
 */
watch(
  () => session.isUnlocked,
  (unlocked) => {
    if (unlocked) return

    ui.closeAll()
    if (!session.hasAccount || !session.hasPin) return
    if (router.currentRoute.value.name === 'lock') return
    void router.replace({ name: 'lock' })
  },
)
</script>

<template>
  <MotionConfig reduced-motion="user">
    <RouterView />
  </MotionConfig>
</template>
