import type { Debt, DebtDraft, DebtFilter, DebtGroup, DebtStatus } from '../types/debt'

export function totalOutstanding(debts: Debt[]): number {
  return debts.reduce((total, debt) => (debt.paid ? total : total + debt.amount), 0)
}

export function sortNewestFirst(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Due dates first, undated debts last, then newest first within a date. */
export function sortByDueDate(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => {
    if (a.dueAt === null && b.dueAt === null) return b.createdAt.localeCompare(a.createdAt)
    if (a.dueAt === null) return 1
    if (b.dueAt === null) return -1
    return a.dueAt.localeCompare(b.dueAt) || b.createdAt.localeCompare(a.createdAt)
  })
}

export function createDebt(draft: DebtDraft): Debt {
  return {
    id: crypto.randomUUID(),
    person: draft.person.trim(),
    amount: parseAmount(draft.amount),
    borrowedAt: draft.borrowedAt,
    dueAt: draft.dueAt || null,
    note: draft.note.trim(),
    paid: false,
    createdAt: new Date().toISOString(),
  }
}

/** Accepts plain digits as well as pasted amounts like "1 250 000" or "1,250,000". */
export function parseAmount(value: string): number {
  return Number(value.replace(/[\s,]/g, ''))
}

/** Local calendar date, not UTC, so a due date is compared in the user's day. */
export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function addDaysISO(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function daysBetween(fromISO: string, toISO: string): number {
  const [fromYear, fromMonth, fromDay] = fromISO.split('-').map(Number)
  const [toYear, toMonth, toDay] = toISO.split('-').map(Number)
  const from = Date.UTC(fromYear, fromMonth - 1, fromDay)
  const to = Date.UTC(toYear, toMonth - 1, toDay)
  return Math.round((to - from) / 86_400_000)
}

export function isOverdue(debt: Debt, today: string): boolean {
  return !debt.paid && debt.dueAt !== null && debt.dueAt < today
}

export function isDueSoon(debt: Debt, today: string, days = 7): boolean {
  if (debt.paid || debt.dueAt === null) return false
  return debt.dueAt >= today && debt.dueAt <= addDaysISO(today, days)
}

export function getDebtStatus(debt: Debt, today: string): DebtStatus {
  if (debt.paid) return 'paid'
  if (isOverdue(debt, today)) return 'overdue'
  if (isDueSoon(debt, today)) return 'due-soon'
  return 'open'
}

export function statusKey(status: DebtStatus): string {
  switch (status) {
    case 'paid':
      return 'status.paid'
    case 'overdue':
      return 'status.overdue'
    case 'due-soon':
      return 'status.due-soon'
    default:
      return 'status.open'
  }
}

export function openDebts(debts: Debt[]): Debt[] {
  return debts.filter((debt) => !debt.paid)
}

export function overdueDebts(debts: Debt[], today: string): Debt[] {
  return sortByDueDate(debts.filter((debt) => isOverdue(debt, today)))
}

export function upcomingDebts(debts: Debt[], today: string, days = 7): Debt[] {
  return sortByDueDate(
    debts.filter(
      (debt) =>
        !debt.paid && debt.dueAt !== null && debt.dueAt >= today && debt.dueAt <= addDaysISO(today, days),
    ),
  )
}

export function searchDebts(debts: Debt[], query: string): Debt[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return debts
  return debts.filter(
    (debt) => debt.person.toLowerCase().includes(needle) || debt.note.toLowerCase().includes(needle),
  )
}

export function filterDebts(debts: Debt[], filter: DebtFilter, today: string): Debt[] {
  switch (filter) {
    case 'open':
      return debts.filter((debt) => !debt.paid)
    case 'overdue':
      return debts.filter((debt) => isOverdue(debt, today))
    case 'paid':
      return debts.filter((debt) => debt.paid)
    default:
      return debts
  }
}

/** Groups are case-insensitive; the first spelling of a name is displayed. */
export function groupByPerson(debts: Debt[], today = todayISO()): DebtGroup[] {
  const groups = new Map<string, DebtGroup>()

  for (const debt of debts) {
    const person = debt.person.trim() || 'Unnamed'
    const key = person.toLocaleLowerCase()
    const existing = groups.get(key)

    if (existing) {
      existing.debts.push(debt)
      if (!debt.paid) {
        existing.outstanding += debt.amount
        existing.openCount += 1
      }
    } else {
      groups.set(key, {
        person,
        debts: [debt],
        outstanding: debt.paid ? 0 : debt.amount,
        openCount: debt.paid ? 0 : 1,
        overdueCount: 0,
      })
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      debts: sortByDueDate(group.debts),
      overdueCount: group.debts.filter((debt) => isOverdue(debt, today)).length,
    }))
    .sort((a, b) => b.outstanding - a.outstanding || a.person.localeCompare(b.person))
}
