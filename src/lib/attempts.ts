import {
  ATTEMPTS_KEY,
  PIN_ATTEMPTS_BEFORE_LOCK,
  PIN_ATTEMPTS_BEFORE_PASSWORD,
  PIN_LOCKOUT_MS,
} from '../config/security'

export interface AttemptState {
  wrongPin: number
  wrongTotal: number
  lockedUntil: number
}

export const EMPTY_ATTEMPTS: AttemptState = {
  wrongPin: 0,
  wrongTotal: 0,
  lockedUntil: 0,
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function normalise(value: unknown): AttemptState {
  if (!value || typeof value !== 'object') return { ...EMPTY_ATTEMPTS }
  const candidate = value as Record<string, unknown>
  const wrongPin =
    typeof candidate.wrongPin === 'number' && Number.isFinite(candidate.wrongPin)
      ? Math.max(0, Math.floor(candidate.wrongPin))
      : 0
  const wrongTotal =
    typeof candidate.wrongTotal === 'number' && Number.isFinite(candidate.wrongTotal)
      ? Math.max(0, Math.floor(candidate.wrongTotal))
      : 0
  const lockedUntil =
    typeof candidate.lockedUntil === 'number' && Number.isFinite(candidate.lockedUntil)
      ? Math.max(0, candidate.lockedUntil)
      : 0
  return { wrongPin, wrongTotal, lockedUntil }
}

export function readAttempts(): AttemptState {
  const store = storage()
  if (!store) return { ...EMPTY_ATTEMPTS }
  const raw = store.getItem(ATTEMPTS_KEY)
  if (!raw) return { ...EMPTY_ATTEMPTS }
  try {
    return normalise(JSON.parse(raw))
  } catch {
    store.removeItem(ATTEMPTS_KEY)
    return { ...EMPTY_ATTEMPTS }
  }
}

export function writeAttempts(state: AttemptState): void {
  const store = storage()
  if (!store) return
  store.setItem(ATTEMPTS_KEY, JSON.stringify(state))
}

export function resetAttempts(): AttemptState {
  const next = { ...EMPTY_ATTEMPTS }
  writeAttempts(next)
  return next
}

/**
 * Each wrong PIN increments the session streak and the lifetime total. Five
 * wrong attempts (and every attempt after) start a fresh 60-second lockout.
 */
export function recordWrongPin(state: AttemptState, now = Date.now()): AttemptState {
  const wrongPin = state.wrongPin + 1
  const wrongTotal = state.wrongTotal + 1
  const lockedUntil =
    wrongPin >= PIN_ATTEMPTS_BEFORE_LOCK ? now + PIN_LOCKOUT_MS : 0
  return { wrongPin, wrongTotal, lockedUntil }
}

export function recordSuccess(): AttemptState {
  return resetAttempts()
}

export function remainingLockMs(state: AttemptState, now = Date.now()): number {
  return Math.max(0, state.lockedUntil - now)
}

export function isLockedOut(state: AttemptState, now = Date.now()): boolean {
  return remainingLockMs(state, now) > 0
}

export function requiresPassword(state: AttemptState): boolean {
  return state.wrongTotal >= PIN_ATTEMPTS_BEFORE_PASSWORD
}
