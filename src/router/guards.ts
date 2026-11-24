import type { Router } from 'vue-router'
import { i18n } from '../i18n'
import { useSessionStore } from '../stores/session'

const AUTH_ROUTES = new Set(['signup', 'login', 'setup-pin', 'lock'])

/**
 * The guard is the single place that decides which screen is reachable for the
 * current account, PIN, and in-memory DEK state.
 */
export function installGuards(router: Router): void {
  router.beforeEach(async (to) => {
    const session = useSessionStore()
    if (!session.ready) await session.init()

    const name = typeof to.name === 'string' ? to.name : ''
    const isAuthRoute = AUTH_ROUTES.has(name)

    if (!session.hasAccount) {
      return name === 'signup' ? true : { name: 'signup', replace: true }
    }

    if (name === 'signup') {
      if (!session.hasPin) {
        return { name: session.isUnlocked ? 'setup-pin' : 'login', replace: true }
      }
      return { name: session.isUnlocked ? 'home' : 'lock', replace: true }
    }

    if (!session.hasPin) {
      if (!session.isUnlocked) {
        return name === 'login' ? true : { name: 'login', replace: true }
      }
      return name === 'setup-pin' ? true : { name: 'setup-pin', replace: true }
    }

    if (!session.isUnlocked) {
      return name === 'lock' ? true : { name: 'lock', replace: true }
    }

    if (isAuthRoute) return { name: 'home', replace: true }
    return true
  })

  router.afterEach((to) => {
    const key = to.meta.titleKey
    const page = key ? i18n.global.t(key) : i18n.global.t('app.name')
    document.title = i18n.global.t('app.documentTitle', { page })
  })
}
