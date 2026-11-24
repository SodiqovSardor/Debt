import type { DebtDraft, DebtErrors } from '../types/debt'
import { parseAmount } from './debts'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** Error values are translation keys so the UI can react to a locale change. */
export function validateDebt(draft: DebtDraft): DebtErrors {
  const errors: DebtErrors = {}

  if (!draft.person.trim()) {
    errors.person = 'validation.personRequired'
  }

  const amount = draft.amount.trim()
  if (!amount) {
    errors.amount = 'validation.amountRequired'
  } else if (!Number.isFinite(parseAmount(amount))) {
    errors.amount = 'validation.amountInvalid'
  } else if (parseAmount(amount) <= 0) {
    errors.amount = 'validation.amountPositive'
  }

  if (!draft.borrowedAt) {
    errors.borrowedAt = 'validation.borrowedRequired'
  } else if (!ISO_DATE.test(draft.borrowedAt)) {
    errors.borrowedAt = 'validation.dateInvalid'
  }

  if (draft.dueAt) {
    if (!ISO_DATE.test(draft.dueAt)) {
      errors.dueAt = 'validation.dateInvalid'
    } else if (draft.dueAt < draft.borrowedAt) {
      errors.dueAt = 'validation.dueBeforeBorrowed'
    }
  }

  return errors
}
