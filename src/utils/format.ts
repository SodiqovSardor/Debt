import { i18n, localeTag } from '../i18n'
import { daysBetween } from './debts'

const currencyFormatters = new Map<string, Intl.NumberFormat>()
const compactFormatters = new Map<string, Intl.NumberFormat>()
const compactUnitFormatters = new Map<string, Intl.NumberFormat>()
const longDateFormatters = new Map<string, Intl.DateTimeFormat>()
const shortDateFormatters = new Map<string, Intl.DateTimeFormat>()
const percentFormatters = new Map<string, Intl.NumberFormat>()

function currencyFormatter(): Intl.NumberFormat {
  const tag = localeTag()
  let formatter = currencyFormatters.get(tag)
  if (!formatter) {
    formatter = new Intl.NumberFormat(tag, {
      style: 'currency',
      currency: 'UZS',
      maximumFractionDigits: 0,
    })
    currencyFormatters.set(tag, formatter)
  }
  return formatter
}

function longDateFormatter(): Intl.DateTimeFormat {
  const tag = localeTag()
  let formatter = longDateFormatters.get(tag)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(tag, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    longDateFormatters.set(tag, formatter)
  }
  return formatter
}

function shortDateFormatter(): Intl.DateTimeFormat {
  const tag = localeTag()
  let formatter = shortDateFormatters.get(tag)
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short' })
    shortDateFormatters.set(tag, formatter)
  }
  return formatter
}

function percentFormatter(): Intl.NumberFormat {
  const tag = localeTag()
  let formatter = percentFormatters.get(tag)
  if (!formatter) {
    formatter = new Intl.NumberFormat(tag, {
      style: 'percent',
      maximumFractionDigits: 0,
    })
    percentFormatters.set(tag, formatter)
  }
  return formatter
}

export function formatUZS(amount: number): string {
  return currencyFormatter().format(amount)
}

/** Compact number without the currency, for hubs too tight for `22,3 mln soʻm`. */
export function formatCompactAmount(amount: number): string {
  const tag = localeTag()
  let formatter = compactFormatters.get(tag)
  if (!formatter) {
    formatter = new Intl.NumberFormat(tag, {
      notation: 'compact',
      maximumFractionDigits: 1,
    })
    compactFormatters.set(tag, formatter)
  }
  return formatter.format(amount)
}

/** Locale-correct UZS unit (`soʻm` in Uzbek, `UZS` in Russian and English). */
export function formatCurrencyUnit(): string {
  const tag = localeTag()
  let formatter = compactUnitFormatters.get(tag)
  if (!formatter) {
    formatter = new Intl.NumberFormat(tag, {
      style: 'currency',
      currency: 'UZS',
      notation: 'compact',
      maximumFractionDigits: 1,
    })
    compactUnitFormatters.set(tag, formatter)
  }
  const unit = formatter.formatToParts(0).find((part) => part.type === 'currency')
  return unit?.value ?? 'UZS'
}

function parseISODate(iso: string | null): Date | null {
  if (!iso) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(iso: string | null): string {
  const date = parseISODate(iso)
  return date ? longDateFormatter().format(date) : i18n.global.t('format.noDate')
}

export function formatShortDate(iso: string | null): string {
  const date = parseISODate(iso)
  return date ? shortDateFormatter().format(date) : i18n.global.t('format.noDate')
}

export function formatPercent(value: number): string {
  return percentFormatter().format(value / 100)
}

export function formatDueLabel(dueAt: string | null, today: string): string {
  if (!dueAt) return i18n.global.t('format.noDueDate')
  const difference = daysBetween(today, dueAt)
  if (difference < 0) {
    const days = Math.abs(difference)
    return i18n.global.t('format.overdueDays', { n: days })
  }
  if (difference === 0) return i18n.global.t('format.dueToday')
  if (difference === 1) return i18n.global.t('format.dueTomorrow')
  return i18n.global.t('format.dueInDays', { n: difference })
}
