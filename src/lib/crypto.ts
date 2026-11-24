import { IV_BYTES } from '../config/security'

export interface EncryptedPayload {
  iv: string
  ct: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export async function deriveBits(
  secret: string,
  salt: Uint8Array,
  iterations: number,
  length: number,
): Promise<Uint8Array> {
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret) as BufferSource,
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt as BufferSource,
      iterations,
    },
    material,
    length * 8,
  )
  return new Uint8Array(bits)
}

export async function importAesKey(bytes: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', bytes as BufferSource, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ])
}

export async function aesEncrypt(
  key: CryptoKey,
  plaintext: string | Uint8Array,
): Promise<EncryptedPayload> {
  const data = typeof plaintext === 'string' ? encoder.encode(plaintext) : plaintext
  const iv = randomBytes(IV_BYTES)
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    data as BufferSource,
  )
  return {
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ciphertext)),
  }
}

/**
 * A GCM authentication failure is deliberately allowed to reject. Callers turn
 * that rejection into "wrong password" or "wrong PIN".
 */
export async function aesDecrypt(
  key: CryptoKey,
  payload: EncryptedPayload,
): Promise<Uint8Array> {
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: fromBase64(payload.iv) as BufferSource,
    },
    key,
    fromBase64(payload.ct) as BufferSource,
  )
  return new Uint8Array(plaintext)
}

export async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return new Uint8Array(digest)
}

/** Length-aware comparison that does not exit at the first differing byte. */
export function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const length = Math.max(a.length, b.length)
  let difference = a.length ^ b.length
  for (let index = 0; index < length; index += 1) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0)
  }
  return difference === 0
}

export function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunk = 0x8000
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk))
  }
  return btoa(binary)
}

export function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

export function utf8Decode(bytes: Uint8Array): string {
  return decoder.decode(bytes)
}

export function isEncryptedPayload(value: unknown): value is EncryptedPayload {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.iv === 'string' && typeof candidate.ct === 'string'
}
