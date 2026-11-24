import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useDebtsStore } from './debts'
import {
  AccountExistsError,
  AccountMissingError,
  WrongSecretError,
  clearPin as clearStoredPin,
  createAccount,
  deleteAll as deleteAllStorage,
  purgeLegacyStorage,
  readAccount,
  setPin as storePin,
  unlockWithPin as unwrapWithPin,
  unwrapWithPassword,
  type AccountRecord,
  type UnwrappedDek,
} from '../lib/account'
import {
  EMPTY_ATTEMPTS,
  isLockedOut,
  readAttempts,
  recordWrongPin,
  remainingLockMs,
  requiresPassword,
  resetAttempts,
  type AttemptState,
} from '../lib/attempts'
import { loadVault, saveVault } from '../lib/vault'
import type { Debt } from '../types/debt'

export type PinResult = 'ok' | 'wrong' | 'locked' | 'password-required' | 'missing'

export const useSessionStore = defineStore('session', () => {
  const debts = useDebtsStore()

  const ready = ref(false)
  const account = ref<AccountRecord | null>(null)
  const isUnlocked = ref(false)
  const attempts = ref<AttemptState>({ ...EMPTY_ATTEMPTS })

  let dek: UnwrappedDek | null = null

  const username = computed(() => account.value?.username ?? '')
  const hasAccount = computed(() => account.value !== null)
  const hasPin = computed(
    () => Boolean(account.value?.pinWrap && account.value?.pinSalt),
  )
  const wrongPinCount = computed(() => attempts.value.wrongPin)
  const wrongTotalCount = computed(() => attempts.value.wrongTotal)

  function wipeDek(): void {
    if (dek) dek.raw.fill(0)
    dek = null
    isUnlocked.value = false
  }

  function clearVault(): void {
    debts.configurePersistence(null)
    debts.clear()
  }

  async function hydrateVault(key: CryptoKey): Promise<void> {
    const items = await loadVault(key)
    debts.load(items)
    debts.configurePersistence((next: Debt[]) => saveVault(key, next))
  }

  async function clearSession(): Promise<void> {
    await debts.flush()
    clearVault()
    wipeDek()
  }

  async function init(): Promise<void> {
    if (ready.value) return
    purgeLegacyStorage()

    const stored = readAccount()
    account.value = stored
    attempts.value = readAttempts()

    // A refresh must not undo the ten-attempt password requirement.
    if (stored?.pinWrap && requiresPassword(attempts.value)) {
      try {
        account.value = await clearStoredPin()
        attempts.value = resetAttempts()
      } catch {
        account.value = stored
      }
    }

    ready.value = true
  }

  async function signup(nextUsername: string, password: string): Promise<void> {
    const created = await createAccount(nextUsername, password)
    account.value = created.account
    dek = created.dek
    isUnlocked.value = true
    attempts.value = resetAttempts()
    clearVault()
    debts.configurePersistence((next: Debt[]) => saveVault(created.dek.key, next))
  }

  async function login(password: string): Promise<void> {
    const current = account.value ?? readAccount()
    if (!current) throw new AccountMissingError()

    const next = await unwrapWithPassword(current, password)
    await hydrateVault(next.key)
    dek = next
    isUnlocked.value = true
    attempts.value = resetAttempts()
  }

  async function setupPin(pin: string): Promise<void> {
    if (!dek) throw new AccountMissingError()
    account.value = await storePin(dek.raw, pin)
    isUnlocked.value = true
    attempts.value = resetAttempts()
  }

  async function unlockWithPin(pin: string): Promise<PinResult> {
    const current = account.value
    if (!current?.pinWrap || !current.pinSalt) return 'missing'
    if (isLockedOut(attempts.value)) return 'locked'

    try {
      const next = await unwrapWithPin(current, pin)
      await hydrateVault(next.key)
      dek = next
      isUnlocked.value = true
      attempts.value = resetAttempts()
      return 'ok'
    } catch (error) {
      if (!(error instanceof WrongSecretError)) throw error

      attempts.value = recordWrongPin(attempts.value)

      if (requiresPassword(attempts.value)) {
        account.value = await clearStoredPin()
        attempts.value = resetAttempts()
        return 'password-required'
      }

      return isLockedOut(attempts.value) ? 'locked' : 'wrong'
    }
  }

  async function forgotPin(): Promise<void> {
    if (account.value?.pinWrap) {
      account.value = await clearStoredPin()
    }
    attempts.value = resetAttempts()
    await clearSession()
  }

  async function signOut(): Promise<void> {
    if (account.value?.pinWrap) {
      account.value = await clearStoredPin()
    }
    attempts.value = resetAttempts()
    await clearSession()
  }

  async function lock(): Promise<void> {
    if (!isUnlocked.value) return
    await clearSession()
  }

  async function deleteAllData(): Promise<void> {
    // Let a queued encrypted save land before the storage is wiped, otherwise it
    // could recreate the vault after the delete.
    await debts.flush()
    debts.configurePersistence(null)
    debts.clear()
    wipeDek()
    deleteAllStorage()
    account.value = null
    attempts.value = { ...EMPTY_ATTEMPTS }
  }

  function remainingLock(): number {
    return remainingLockMs(attempts.value)
  }

  return {
    ready,
    account,
    isUnlocked,
    attempts,
    username,
    hasAccount,
    hasPin,
    wrongPinCount,
    wrongTotalCount,
    init,
    signup,
    login,
    setupPin,
    unlockWithPin,
    forgotPin,
    signOut,
    lock,
    deleteAllData,
    remainingLock,
  }
})

export { AccountExistsError, WrongSecretError }
