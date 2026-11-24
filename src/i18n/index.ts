import { createI18n } from 'vue-i18n'
import { LOCALE_KEY } from '../config/security'
import type { Locale } from '../types/debt'
import en from './locales/en'
import ru from './locales/ru'
import uz from './locales/uz'

const LOCALES: Locale[] = ['uz', 'ru', 'en']
const HTML_LANG: Record<Locale, string> = {
  uz: 'uz-Latn',
  ru: 'ru',
  en: 'en',
}
const LOCALE_TAG: Record<Locale, string> = {
  uz: 'uz-Latn-UZ',
  ru: 'ru-RU',
  en: 'en-US',
}

function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as string[]).includes(value)
}

function readStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_KEY)
    return isLocale(value) ? value : null
  } catch {
    return null
  }
}

export function detectLocale(): Locale {
  const stored = readStoredLocale()
  if (stored) return stored

  if (typeof navigator !== 'undefined') {
    const language = navigator.language.toLowerCase()
    if (language.startsWith('uz')) return 'uz'
    if (language.startsWith('ru')) return 'ru'
  }

  return 'en'
}

function russianPlural(choice: number, choicesLength: number): number {
  if (choicesLength < 3) return choice === 1 ? 0 : 1
  const value = Math.abs(choice) % 100
  const last = value % 10
  if (value > 10 && value < 20) return 2
  if (last === 1) return 0
  if (last >= 2 && last <= 4) return 1
  return 2
}

function applyDocumentLocale(locale: Locale): void {
  if (typeof document === 'undefined') return
  document.documentElement.lang = HTML_LANG[locale]
  document.documentElement.dir = 'ltr'
}

const initialLocale = detectLocale()

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'en',
  messages: { en, ru, uz },
  pluralRules: { ru: russianPlural },
  missingWarn: false,
  fallbackWarn: false,
})

applyDocumentLocale(initialLocale)

export function getLocale(): Locale {
  return isLocale(i18n.global.locale.value) ? i18n.global.locale.value : 'en'
}

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    // A blocked storage API should not prevent switching languages.
  }
  applyDocumentLocale(locale)
}

export function localeTag(locale: Locale = getLocale()): string {
  return LOCALE_TAG[locale]
}
