import { PIN_MAX_LENGTH, PIN_MIN_LENGTH } from '../config/security'

export type PinSlotsState = 'idle' | 'wrong' | 'correct'

/**
 * PINs that anyone could guess in a few tries. A PIN made only of one digit or
 * one straight run (1234, 98765) is rejected; mixed PINs are accepted.
 */
export function isTrivialPin(pin: string): boolean {
  if (pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) return false
  if (!/^\d+$/.test(pin)) return true

  const digits = [...pin].map(Number)
  const same = digits.every((digit) => digit === digits[0])
  if (same) return true

  let ascending = true
  let descending = true
  for (let index = 1; index < digits.length; index += 1) {
    if (digits[index] !== digits[index - 1] + 1) ascending = false
    if (digits[index] !== digits[index - 1] - 1) descending = false
  }

  return ascending || descending
}
