import { describe, expect, it } from 'vitest'
import type { Debt } from '../types/debt'
import {
  addDaysISO,
  createDebt,
  filterDebts,
  getDebtStatus,
  groupByPerson,
  isDueSoon,
  isOverdue,
  searchDebts,
  totalOutstanding,
  upcomingDebts,
} from './debts'

const TODAY = '2026-03-10'

function makeDebt(overrides: Partial<Debt> = {}): Debt {
  return {
    id: crypto.randomUUID(),
    person: 'Ali',
    amount: 1_000,
    borrowedAt: '2026-03-01',
    dueAt: null,
    note: '',
    paid: false,
    createdAt: '2026-03-01T10:00:00.000Z',
    ...overrides,
  }
}

describe('totalOutstanding', () => {
  it('sums only unpaid debts', () => {
    const debts = [
      makeDebt({ amount: 1_000 }),
      makeDebt({ amount: 2_500, paid: true }),
      makeDebt({ amount: 500 }),
    ]
    expect(totalOutstanding(debts)).toBe(1_500)
  })
})

describe('overdue and upcoming', () => {
  const overdue = makeDebt({ amount: 50, dueAt: '2026-03-09' })
  const dueToday = makeDebt({ amount: 300, dueAt: TODAY })
  const dueInSeven = makeDebt({ amount: 200, dueAt: addDaysISO(TODAY, 7) })
  const dueInEight = makeDebt({ amount: 100, dueAt: addDaysISO(TODAY, 8) })
  const paidSoon = makeDebt({ amount: 400, dueAt: addDaysISO(TODAY, 2), paid: true })

  it('treats a past unpaid due date as overdue', () => {
    expect(isOverdue(overdue, TODAY)).toBe(true)
    expect(isOverdue(makeDebt({ dueAt: TODAY }), TODAY)).toBe(false)
    expect(isOverdue(makeDebt({ dueAt: '2026-03-01', paid: true }), TODAY)).toBe(false)
  })

  it('includes the next seven days but not day eight or overdue debts', () => {
    expect(upcomingDebts([overdue, dueToday, dueInSeven, dueInEight, paidSoon], TODAY)).toEqual([
      dueToday,
      dueInSeven,
    ])
  })

  it('treats today as due soon', () => {
    expect(isDueSoon(dueToday, TODAY)).toBe(true)
    expect(isDueSoon(dueInEight, TODAY)).toBe(false)
    expect(isDueSoon(paidSoon, TODAY)).toBe(false)
  })
})

describe('groupByPerson', () => {
  it('merges names case-insensitively and totals only open debts', () => {
    const debts = [
      makeDebt({ person: 'Ali', amount: 1_000, dueAt: '2026-03-05' }),
      makeDebt({ person: 'ali', amount: 500, paid: true }),
      makeDebt({ person: 'Bob', amount: 2_000 }),
    ]

    const groups = groupByPerson(debts, TODAY)

    expect(groups.map((group) => group.person)).toEqual(['Bob', 'Ali'])
    expect(groups[1]).toMatchObject({
      person: 'Ali',
      outstanding: 1_000,
      openCount: 1,
      overdueCount: 1,
    })
    expect(groups[1]?.debts).toHaveLength(2)
  })

  it('sorts undated debts after dated debts inside a group', () => {
    const dated = makeDebt({ id: 'dated', dueAt: '2026-04-01' })
    const undated = makeDebt({ id: 'undated', dueAt: null })
    const group = groupByPerson([undated, dated], TODAY)[0]
    expect(group?.debts.map((debt) => debt.id)).toEqual(['dated', 'undated'])
  })
})

describe('search and filter', () => {
  const debts = [
    makeDebt({ person: 'Ali', note: 'Lunch', dueAt: '2026-03-01' }),
    makeDebt({ person: 'Bob', note: 'Train ticket', paid: true }),
    makeDebt({ person: 'Dilnoza', note: 'Book', dueAt: '2026-03-20' }),
  ]

  it('searches both person and note without case sensitivity', () => {
    expect(searchDebts(debts, 'ali')).toEqual([debts[0]])
    expect(searchDebts(debts, 'TRAIN')).toEqual([debts[1]])
    expect(searchDebts(debts, '')).toEqual(debts)
  })

  it('filters by ledger status', () => {
    expect(filterDebts(debts, 'overdue', TODAY)).toEqual([debts[0]])
    expect(filterDebts(debts, 'paid', TODAY)).toEqual([debts[1]])
    expect(filterDebts(debts, 'open', TODAY)).toEqual([debts[0], debts[2]])
    expect(filterDebts(debts, 'all', TODAY)).toEqual(debts)
  })

  it('reports a single status for each row', () => {
    expect(getDebtStatus(debts[0]!, TODAY)).toBe('overdue')
    expect(getDebtStatus(debts[1]!, TODAY)).toBe('paid')
    expect(getDebtStatus(debts[2]!, TODAY)).toBe('open')
    expect(getDebtStatus(makeDebt({ dueAt: TODAY }), TODAY)).toBe('due-soon')
  })
})

describe('createDebt', () => {
  it('trims text, parses the amount, and turns an empty due date into null', () => {
    const debt = createDebt({
      person: '  Nodira  ',
      amount: '1250000',
      borrowedAt: '2026-03-01',
      dueAt: '',
      note: '  Rent  ',
    })

    expect(debt.person).toBe('Nodira')
    expect(debt.amount).toBe(1_250_000)
    expect(debt.note).toBe('Rent')
    expect(debt.dueAt).toBeNull()
    expect(debt.paid).toBe(false)
    expect(debt.id).toBeTruthy()
  })
})

describe('addDaysISO', () => {
  it('rolls across month and year boundaries without timezone drift', () => {
    expect(addDaysISO('2026-12-28', 7)).toBe('2027-01-04')
    expect(addDaysISO('2026-02-25', 3)).toBe('2026-02-28')
  })
})
