export interface Debt {
  id: string
  person: string
  amount: number
  borrowedAt: string
  dueAt: string | null
  note: string
  paid: boolean
  createdAt: string
}

/** Raw form values stay strings so they can be validated before parsing. */
export interface DebtDraft {
  person: string
  amount: string
  borrowedAt: string
  dueAt: string
  note: string
}

export type DebtErrors = Partial<Record<keyof DebtDraft, string>>

export type DebtFilter = 'all' | 'open' | 'overdue' | 'paid'

export type DebtStatus = 'open' | 'due-soon' | 'overdue' | 'paid'

export interface DebtGroup {
  person: string
  debts: Debt[]
  outstanding: number
  openCount: number
  overdueCount: number
}

export type ThemeMode = 'dark' | 'light'

export type Locale = 'uz' | 'ru' | 'en'

export type TabId = 'home' | 'debts' | 'insights' | 'profile'
