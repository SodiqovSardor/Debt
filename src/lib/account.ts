import {
  ACCOUNT_KEY,
  DEK_BYTES,
  PASSWORD_ITERATIONS,
  PIN_ITERATIONS,
  SALT_BYTES,
  STORAGE_PREFIX,
} from '../config/security'
import {
  aesDecrypt,
  aesEncrypt,
  constantTimeEqual,
  deriveBits,
  fromBase64,
  importAesKey,
  isEncryptedPayload,
  randomBytes,
  sha256,
  toBase64,
  type EncryptedPayload,
} from './crypto'

export interface AccountRecord {
  username: string
  salt: string
  check: string
  iterations: number
  pwWrap: EncryptedPayload
  pinSalt: string | null
  pinWrap: EncryptedPayload | null
  createdAt: string
}

export interface UnwrappedDek {
  key: CryptoKey
  raw: Uint8Array
}

export class WrongSecretError extends Error {
  constructor(message = 'The secret is incorrect.') {
    super(message)
    this.name = 'WrongSecretError'
  }
}

export class NoPinError extends Error {
  constructor() {
    super('No PIN is configured.')
    this.name = 'NoPinError'
  }
}

export class AccountExistsError extends Error {
  constructor() {
    super('An account already exists on this device.')
    this.name = 'AccountExistsError'
  }
}

export class AccountMissingError extends Error {
  constructor() {
    super('No account exists on this device.')
    this.name = 'AccountMissingError'
  }
}

interface PasswordParts {
  auth: Uint8Array
  wrap: Uint8Array
  check: Uint8Array
}

function storage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function isAccountRecord(value: unknown): value is AccountRecord {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.username !== 'string' ||
    !candidate.username.trim() ||
    typeof candidate.salt !== 'string' ||
    typeof candidate.check !== 'string' ||
    typeof candidate.iterations !== 'number' ||
    !Number.isFinite(candidate.iterations) ||
    candidate.iterations <= 0 ||
    typeof candidate.createdAt !== 'string' ||
    !isEncryptedPayload(candidate.pwWrap)
  ) {
    return false
  }

  const hasPinSalt = typeof candidate.pinSalt === 'string' && candidate.pinSalt.length > 0
  const hasPinWrap = isEncryptedPayload(candidate.pinWrap)
  if (hasPinSalt !== hasPinWrap) return false

  return true
}

export function readAccount(): AccountRecord | null {
  const store = storage()
  if (!store) return null
  const raw = store.getItem(ACCOUNT_KEY)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isAccountRecord(parsed)) {
      store.removeItem(ACCOUNT_KEY)
      return null
    }
    return parsed
  } catch {
    store.removeItem(ACCOUNT_KEY)
    return null
  }
}

function writeAccount(account: AccountRecord): void {
  const store = storage()
  if (!store) throw new Error('Local storage is unavailable.')
  store.setItem(ACCOUNT_KEY, JSON.stringify(account))
}

async function derivePasswordParts(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<PasswordParts> {
  const bits = await deriveBits(password, salt, iterations, 64)
  const auth = bits.slice(0, 32)
  const wrap = bits.slice(32, 64)
  return { auth, wrap, check: await sha256(auth) }
}

export async function createAccount(
  username: string,
  password: string,
): Promise<{ account: AccountRecord; dek: UnwrappedDek }> {
  if (readAccount()) throw new AccountExistsError()

  const cleanUsername = username.trim()
  if (!cleanUsername || !password) throw new Error('Username and password are required.')

  const salt = randomBytes(SALT_BYTES)
  const parts = await derivePasswordParts(password, salt, PASSWORD_ITERATIONS)
  const wrappingKey = await importAesKey(parts.wrap)
  const rawDek = randomBytes(DEK_BYTES)
  const pwWrap = await aesEncrypt(wrappingKey, rawDek)

  const account: AccountRecord = {
    username: cleanUsername,
    salt: toBase64(salt),
    check: toBase64(parts.check),
    iterations: PASSWORD_ITERATIONS,
    pwWrap,
    pinSalt: null,
    pinWrap: null,
    createdAt: new Date().toISOString(),
  }

  writeAccount(account)

  return {
    account,
    dek: { key: await importAesKey(rawDek), raw: rawDek },
  }
}

export async function verifyPassword(account: AccountRecord, password: string): Promise<boolean> {
  const parts = await derivePasswordParts(
    password,
    fromBase64(account.salt),
    account.iterations,
  )
  return constantTimeEqual(parts.check, fromBase64(account.check))
}

export async function unwrapWithPassword(
  account: AccountRecord,
  password: string,
): Promise<UnwrappedDek> {
  const parts = await derivePasswordParts(
    password,
    fromBase64(account.salt),
    account.iterations,
  )
  if (!constantTimeEqual(parts.check, fromBase64(account.check))) {
    throw new WrongSecretError()
  }

  const wrappingKey = await importAesKey(parts.wrap)
  let raw: Uint8Array
  try {
    raw = await aesDecrypt(wrappingKey, account.pwWrap)
  } catch {
    throw new WrongSecretError()
  }

  return { key: await importAesKey(raw), raw }
}

export async function setPin(dek: Uint8Array, pin: string): Promise<AccountRecord> {
  const account = readAccount()
  if (!account) throw new AccountMissingError()

  const pinSalt = randomBytes(SALT_BYTES)
  const pinKeyBytes = await deriveBits(pin, pinSalt, PIN_ITERATIONS, 32)
  const pinKey = await importAesKey(pinKeyBytes)
  const pinWrap = await aesEncrypt(pinKey, dek)

  const next: AccountRecord = {
    ...account,
    pinSalt: toBase64(pinSalt),
    pinWrap,
  }
  writeAccount(next)
  return next
}

export async function unlockWithPin(
  account: AccountRecord,
  pin: string,
): Promise<UnwrappedDek> {
  if (!account.pinSalt || !account.pinWrap) throw new NoPinError()

  const pinKeyBytes = await deriveBits(
    pin,
    fromBase64(account.pinSalt),
    PIN_ITERATIONS,
    32,
  )
  const pinKey = await importAesKey(pinKeyBytes)

  let raw: Uint8Array
  try {
    raw = await aesDecrypt(pinKey, account.pinWrap)
  } catch {
    throw new WrongSecretError()
  }

  return { key: await importAesKey(raw), raw }
}

export async function clearPin(): Promise<AccountRecord> {
  const account = readAccount()
  if (!account) throw new AccountMissingError()

  const next: AccountRecord = {
    ...account,
    pinSalt: null,
    pinWrap: null,
  }
  writeAccount(next)
  return next
}

export function deleteAll(): void {
  const store = storage()
  if (!store) return
  const keys: string[] = []
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index)
    if (key) keys.push(key)
  }
  for (const key of keys) {
    if (key.startsWith(STORAGE_PREFIX) || key.startsWith('debt-ledger:')) {
      store.removeItem(key)
    }
  }
}

/**
 * The previous version of this app stored a plaintext ledger under a different
 * prefix. Remove those keys so an upgrade can never leave plain debt text behind.
 */
export function purgeLegacyStorage(): void {
  const store = storage()
  if (!store) return
  const keys: string[] = []
  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index)
    if (key?.startsWith('debt-ledger:')) keys.push(key)
  }
  for (const key of keys) store.removeItem(key)
}
