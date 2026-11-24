import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import { i18n } from './i18n'
import { router } from './router'
import { applyTheme, useSettingsStore } from './stores/settings'
import { useSessionStore } from './stores/session'

async function bootstrap(): Promise<void> {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(i18n)

  const settings = useSettingsStore(pinia)
  applyTheme(settings.theme)

  const session = useSessionStore(pinia)
  await session.init()

  app.use(router)
  await router.isReady()
  app.mount('#app')
}

void bootstrap()
