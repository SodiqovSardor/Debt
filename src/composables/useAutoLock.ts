import { onBeforeUnmount, watch } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useSessionStore } from '../stores/session'
import { HIDDEN_LOCK_MS, IDLE_LOCK_MS } from '../config/security'

/**
 * Auto-locks the session when the tab is hidden for more than
 * HIDDEN_LOCK_MS (60s) or after IDLE_LOCK_MS (5 min) of no interaction.
 */
export function useAutoLock(enabled = true): void {
  const session = useSessionStore()
  let hiddenAt: number | null = null
  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function resetIdle(): void {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      void session.lock()
    }, IDLE_LOCK_MS)
  }

  function onVisibilityChange(): void {
    if (!enabled || !session.isUnlocked) return
    if (document.hidden) {
      hiddenAt = Date.now()
    } else if (hiddenAt !== null) {
      if (Date.now() - hiddenAt > HIDDEN_LOCK_MS) {
        void session.lock()
      }
      hiddenAt = null
    }
  }

  function onActivity(): void {
    if (!enabled || !session.isUnlocked) return
    resetIdle()
  }

  watch(
    () => session.isUnlocked,
    (unlocked) => {
      if (unlocked) {
        resetIdle()
      } else {
        if (idleTimer) clearTimeout(idleTimer)
        idleTimer = null
        hiddenAt = null
      }
    },
  )

  useEventListener(document, 'visibilitychange', onVisibilityChange)
  useEventListener(document, 'mousedown', onActivity, { passive: true })
  useEventListener(document, 'mousemove', onActivity, { passive: true })
  useEventListener(document, 'keydown', onActivity, { passive: true })
  useEventListener(document, 'touchstart', onActivity, { passive: true })
  useEventListener(document, 'scroll', onActivity, { passive: true })

  onBeforeUnmount(() => {
    if (idleTimer) clearTimeout(idleTimer)
  })

  resetIdle()
}
