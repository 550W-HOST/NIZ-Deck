import { describe, expect, it } from 'vitest'
import { KEYBOARD_84_ROWS, NIZ_84_LAYOUT } from './layout84'

describe('NIZ 84EC key layout', () => {
  it('contains 84 unique contiguous hardware positions', () => {
    const positions = NIZ_84_LAYOUT.keys.map((key) => key.position)
    expect(positions).toHaveLength(84)
    expect(new Set(positions).size).toBe(84)
    expect([...positions].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 84 }, (_, index) => index + 1),
    )
  })

  it('uses the six-row 16u compact geometry', () => {
    expect(KEYBOARD_84_ROWS).toHaveLength(6)
    expect(NIZ_84_LAYOUT).toMatchObject({ width: 16, height: 6, keyCount: 84 })
    expect(NIZ_84_LAYOUT.keys.every((key) => (
      key.x >= 0
      && key.y >= 0
      && key.x + key.width <= NIZ_84_LAYOUT.width
      && key.y + key.height <= NIZ_84_LAYOUT.height
    ))).toBe(true)
  })

  it('preserves known protocol landmarks', () => {
    const labels = new Map(NIZ_84_LAYOUT.keys.map((key) => [key.position, key.label]))
    expect([labels.get(14), labels.get(29), labels.get(44), labels.get(58)]).toEqual([
      'Delete', 'Home', 'PgUp', 'PgDn',
    ])
    expect([labels.get(74), labels.get(77), labels.get(78), labels.get(84)]).toEqual([
      'Fn', 'Space', 'Fn', '→',
    ])
  })
})
