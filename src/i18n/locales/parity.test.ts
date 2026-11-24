import { describe, expect, it } from 'vitest'
import en from './en'
import ru from './ru'
import uz from './uz'

function flattenMessages(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenMessages(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

describe('locale parity', () => {
  const enKeys = flattenMessages(en as Record<string, unknown>)

  it('uz has all en keys', () => {
    const uzKeys = flattenMessages(uz as Record<string, unknown>)
    const missing = enKeys.filter((key) => !uzKeys.includes(key))
    expect(missing).toEqual([])
  })

  it('ru has all en keys', () => {
    const ruKeys = flattenMessages(ru as Record<string, unknown>)
    const missing = enKeys.filter((key) => !ruKeys.includes(key))
    expect(missing).toEqual([])
  })

  it('uz uses U+02BB for o and g, not apostrophe', () => {
    const uzString = JSON.stringify(uz)
    // Should contain the modifier letter turned comma (U+02BB), not a plain apostrophe
    expect(uzString).toContain('\u02BB')
    // Words like "o'zbek" should use Oʻ not O'
    expect(uzString).not.toMatch(/O'/)
    expect(uzString).not.toMatch(/g'/)
  })

  it('ru has three-form plural messages for count', () => {
    // Check that ru has plural forms where en has them
    const ruOverdue = (ru as any).insights?.overdueSummary
    expect(ruOverdue).toContain('долг')
    expect(ruOverdue).toContain('долга')
    expect(ruOverdue).toContain('долгов')
  })
})
