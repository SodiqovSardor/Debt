import { describe, expect, it } from 'vitest'
import {
  aesDecrypt,
  aesEncrypt,
  constantTimeEqual,
  deriveBits,
  importAesKey,
  isEncryptedPayload,
  randomBytes,
  sha256,
  toBase64,
  fromBase64,
} from '../lib/crypto'

describe('crypto', () => {
  it('randomBytes returns the requested length', () => {
    const a = randomBytes(16)
    const b = randomBytes(16)
    expect(a.length).toBe(16)
    expect(b.length).toBe(16)
    expect(a.some((v, i) => v !== b[i])).toBe(true)
  })

  it('deriveBits is deterministic', async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    const a = await deriveBits('secret', salt, 1000, 32)
    const b = await deriveBits('secret', salt, 1000, 32)
    expect(a).toEqual(b)
    expect(a.length).toBe(32)
  })

  it('aesEncrypt/decrypt round-trips', async () => {
    const key = await importAesKey(await deriveBits('key', new Uint8Array(16), 1000, 32))
    const payload = await aesEncrypt(key, 'hello world')
    expect(isEncryptedPayload(payload)).toBe(true)
    const decrypted = await aesDecrypt(key, payload)
    expect(new TextDecoder().decode(decrypted)).toBe('hello world')
  })

  it('aesDecrypt throws on wrong key', async () => {
    const key1 = await importAesKey(await deriveBits('key1', new Uint8Array(16), 1000, 32))
    const key2 = await importAesKey(await deriveBits('key2', new Uint8Array(16), 1000, 32))
    const payload = await aesEncrypt(key1, 'secret data')
    await expect(aesDecrypt(key2, payload)).rejects.toThrow()
  })

  it('constantTimeEqual returns true for equal bytes', () => {
    const a = new Uint8Array([1, 2, 3])
    const b = new Uint8Array([1, 2, 3])
    expect(constantTimeEqual(a, b)).toBe(true)
  })

  it('constantTimeEqual returns false for different bytes', () => {
    const a = new Uint8Array([1, 2, 3])
    const b = new Uint8Array([1, 2, 4])
    expect(constantTimeEqual(a, b)).toBe(false)
  })

  it('constantTimeEqual handles different lengths', () => {
    const a = new Uint8Array([1, 2, 3])
    const b = new Uint8Array([1, 2])
    expect(constantTimeEqual(a, b)).toBe(false)
  })

  it('sha256 is deterministic', async () => {
    const data = new TextEncoder().encode('hash me')
    const a = await sha256(data)
    const b = await sha256(data)
    expect(a).toEqual(b)
    expect(a.length).toBe(32)
  })

  it('base64 round-trips', () => {
    const bytes = new Uint8Array([0, 1, 2, 255, 254, 65, 66, 67])
    const encoded = toBase64(bytes)
    const decoded = fromBase64(encoded)
    expect(decoded).toEqual(bytes)
  })
})
