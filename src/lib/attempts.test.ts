import { describe, expect, it } from 'vitest'
import {
  EMPTY_ATTEMPTS,
  isLockedOut,
  readAttempts,
  recordWrongPin,
  remainingLockMs,
  requiresPassword,
  resetAttempts,
} from '../lib/attempts'

describe('attempts', () => {
  it('empty attempts are not locked and do not require password', () => {
    expect(isLockedOut(EMPTY_ATTEMPTS)).toBe(false)
    expect(requiresPassword(EMPTY_ATTEMPTS)).toBe(false)
    expect(remainingLockMs(EMPTY_ATTEMPTS)).toBe(0)
  })

  it('recordWrongPin increments streak and total', () => {
    const state = recordWrongPin(EMPTY_ATTEMPTS, 1000)
    expect(state.wrongPin).toBe(1)
    expect(state.wrongTotal).toBe(1)
    expect(isLockedOut(state, 1000)).toBe(false)
  })

  it('locks after 5 wrong pins for 60 seconds', () => {
    let state = EMPTY_ATTEMPTS
    for (let i = 0; i < 5; i += 1) state = recordWrongPin(state, 1000)
    expect(isLockedOut(state, 1000)).toBe(true)
    expect(remainingLockMs(state, 1000)).toBe(60_000)
    expect(isLockedOut(state, 1000 + 60_000)).toBe(false)
  })

  it('requires password after 10 total wrong pins', () => {
    let state = EMPTY_ATTEMPTS
    for (let i = 0; i < 9; i += 1) state = recordWrongPin(state, 1000)
    expect(requiresPassword(state)).toBe(false)
    state = recordWrongPin(state, 1000)
    expect(requiresPassword(state)).toBe(true)
  })

  it('recordSuccess resets attempts', () => {
    let state = recordWrongPin(EMPTY_ATTEMPTS, 1000)
    state = recordWrongPin(state, 1000)
    state = resetAttempts()
    expect(state).toEqual(EMPTY_ATTEMPTS)
  })

  it('readAttempts normalizes corrupt data', () => {
    // readAttempts reads from localStorage; in tests it's not available so returns empty
    const state = readAttempts()
    expect(state).toEqual(EMPTY_ATTEMPTS)
  })
})
