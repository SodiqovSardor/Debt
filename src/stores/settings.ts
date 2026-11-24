import { ref } from 'vue'
import { defineStore } from 'pinia'
import { THEME_KEY } from '../config/security'
import type { ThemeMode } from '../types/debt'

const THEME_COLORS: Record<ThemeMode, string> = {
  dark: '#121110',
  light: '#f5efe6',
}

/** Applies the theme to the document before the app paints. */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (meta) meta.content = THEME_COLORS[theme]
}

function readTheme(): ThemeMode {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<ThemeMode>(readTheme())

  function setTheme(next: ThemeMode): void {
    theme.value = next
    applyTheme(next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // Theme changes still apply in memory if storage is blocked.
    }
  }

  return { theme, setTheme }
})
