import { VAULT_KEY } from '../config/security'
import type { Debt } from '../types/debt'
import { aesDecrypt, aesEncrypt, isEncryptedPayload, utf8Decode } from './crypto'

function storage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isDebt(value: unknown): value is Debt {
  if (!value || typeof value !== 'object') return false
  const debt = value as Record<string, unknown>
  return (
    typeof debt.id === 'string' &&
    typeof debt.person === 'string' &&
    typeof debt.amount === 'number' &&
    Number.isFinite(debt.amount) &&
    typeof debt.borrowedAt === 'string' &&
    (debt.dueAt === null || typeof debt.dueAt === 'string') &&
    typeof debt.note === 'string' &&
    typeof debt.paid === 'boolean' &&
    typeof debt.createdAt === 'string'
  )
}

export async function saveVault(dek: CryptoKey, debts: Debt[]): Promise<void> {
  const store = storage()
  if (!store) throw new Error('Local storage is unavailable.')
  const payload = await aesEncrypt(dek, JSON.stringify(debts))
  store.setItem(VAULT_KEY, JSON.stringify(payload))
}

export async function loadVault(dek: CryptoKey): Promise<Debt[]> {
  const store = storage()
  if (!store) return []

  const raw = store.getItem(VAULT_KEY)
  if (!raw) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('The encrypted vault is corrupt.')
  }
  if (!isEncryptedPayload(parsed)) throw new Error('The encrypted vault is corrupt.')

  const plaintext = utf8Decode(await aesDecrypt(dek, parsed))
  let debts: unknown
  try {
    debts = JSON.parse(plaintext)
  } catch {
    throw new Error('The decrypted vault is corrupt.')
  }
  if (!Array.isArray(debts) || !debts.every(isDebt)) {
    throw new Error('The decrypted vault is corrupt.')
  }
  return debts
}
