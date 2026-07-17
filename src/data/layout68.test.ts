import { describe, expect, it } from 'vitest'
import { KEYBOARD_68_ROWS, NIZ_68_LAYOUT, PHYSICAL_KEYS } from './layout68'

describe('NIZ 68 key layout', () => {
  it('contains 68 unique contiguous positions', () => {
    const positions = PHYSICAL_KEYS.map((key) => key.position)
    expect(positions).toHaveLength(68)
    expect(new Set(positions).size).toBe(68)
    expect([...positions].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 68 }, (_, index) => index + 1),
    )
  })

  it('keeps each physical row non-empty', () => {
    expect(KEYBOARD_68_ROWS).toHaveLength(5)
    expect(KEYBOARD_68_ROWS.every((row) => row.length > 0)).toBe(true)
  })

  it('keeps every key inside the 16.25u layout bounds', () => {
    expect(PHYSICAL_KEYS.every((key) => (
      key.x >= 0
      && key.y >= 0
      && key.x + key.width <= NIZ_68_LAYOUT.width
      && key.y + key.height <= NIZ_68_LAYOUT.height
    ))).toBe(true)
  })

  it('matches the 68pro navigation column and bottom-row order', () => {
    expect([15, 30, 44, 58].map((position) => (
      PHYSICAL_KEYS.find((key) => key.position === position)?.label
    ))).toEqual(['`', 'Delete', 'PgUp', 'PgDn'])
    expect([63, 64, 65].map((position) => (
      PHYSICAL_KEYS.find((key) => key.position === position)?.label
    ))).toEqual(['Fn', 'Alt', 'Ctrl'])
  })
})
