import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Debt, DebtDraft } from '../types/debt'
import {
  createDebt,
  groupByPerson,
  overdueDebts,
  parseAmount,
  sortNewestFirst,
  sortByDueDate,
  todayISO,
  totalOutstanding,
  upcomingDebts,
} from '../utils/debts'

type PersistFn = (debts: Debt[]) => Promise<void>

export const useDebtsStore = defineStore('debts', () => {
  const items = ref<Debt[]>([])
  const saveError = ref<string | null>(null)

  let persistence: PersistFn | null = null
  let saveChain: Promise<void> = Promise.resolve()

  const debts = computed(() => sortNewestFirst(items.value))
  const openDebts = computed(() => sortByDueDate(items.value.filter((debt) => !debt.paid)))
  const total = computed(() => totalOutstanding(items.value))
  const openCount = computed(() => items.value.filter((debt) => !debt.paid).length)
  const overdue = computed(() => overdueDebts(items.value, todayISO()))
  const upcoming = computed(() => upcomingDebts(items.value, todayISO(), 7))
  const groups = computed(() => groupByPerson(items.value))

  /**
   * The session owns the DEK, so it installs the encrypted writer after unlock
   * and removes it before clearing the key.
   */
  function configurePersistence(writer: PersistFn | null): void {
    persistence = writer
    if (writer) saveError.value = null
  }

  function queueSave(): void {
    const writer = persistence
    if (!writer) return

    const snapshot = items.value.map((debt) => ({ ...debt }))
    saveChain = saveChain
      .then(() => writer(snapshot))
      .then(() => {
        saveError.value = null
      })
      .catch((error: unknown) => {
        saveError.value = error instanceof Error ? error.message : 'The ledger could not be saved.'
      })
  }

  /** Lets the session finish in-flight writes before it clears the DEK. */
  function flush(): Promise<void> {
    return saveChain
  }

  function load(next: Debt[]): void {
    items.value = next
    saveError.value = null
  }

  function clear(): void {
    items.value = []
    saveError.value = null
  }

  function addDebt(draft: DebtDraft): Debt {
    const debt = createDebt(draft)
    items.value.push(debt)
    queueSave()
    return debt
  }

  function updateDebt(id: string, draft: DebtDraft): Debt | null {
    const debt = items.value.find((item) => item.id === id)
    if (!debt) return null

    debt.person = draft.person.trim()
    debt.amount = parseAmount(draft.amount)
    debt.borrowedAt = draft.borrowedAt
    debt.dueAt = draft.dueAt || null
    debt.note = draft.note.trim()
    queueSave()
    return debt
  }

  function setPaid(id: string, paid: boolean): void {
    const debt = items.value.find((item) => item.id === id)
    if (!debt || debt.paid === paid) return
    debt.paid = paid
    queueSave()
  }

  function togglePaid(id: string): boolean | null {
    const debt = items.value.find((item) => item.id === id)
    if (!debt) return null
    debt.paid = !debt.paid
    queueSave()
    return debt.paid
  }

  function removeDebt(id: string): void {
    const next = items.value.filter((debt) => debt.id !== id)
    if (next.length === items.value.length) return
    items.value = next
    queueSave()
  }

  return {
    items,
    saveError,
    debts,
    openDebts,
    total,
    openCount,
    overdue,
    upcoming,
    groups,
    configurePersistence,
    flush,
    load,
    clear,
    addDebt,
    updateDebt,
    setPaid,
    togglePaid,
    removeDebt,
  }
})
