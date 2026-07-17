import { describe, expect, it } from 'vitest'
import { KEYBOARD_87_ROWS, NIZ_87_LAYOUT } from './layout87'

describe('NIZ 87 key layout', () => {
  it('contains 87 unique contiguous hardware positions', () => {
    const positions = NIZ_87_LAYOUT.keys.map((key) => key.position)
    expect(positions).toHaveLength(87)
    expect(new Set(positions).size).toBe(87)
    expect([...positions].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 87 }, (_, index) => index + 1),
    )
  })

  it('uses the six-row 18.5u TKL geometry', () => {
    expect(KEYBOARD_87_ROWS).toHaveLength(6)
    expect(NIZ_87_LAYOUT).toMatchObject({ width: 18.5, height: 6, keyCount: 87 })
    expect(NIZ_87_LAYOUT.keys.every((key) => (
      key.x >= 0
      && key.y >= 0
      && key.x + key.width <= NIZ_87_LAYOUT.width
      && key.y + key.height <= NIZ_87_LAYOUT.height
    ))).toBe(true)
  })

  it('preserves standard TKL navigation landmarks', () => {
    const labels = new Map(NIZ_87_LAYOUT.keys.map((key) => [key.position, key.label]))
    expect([16, 31, 48, 76, 87].map((position) => labels.get(position))).toEqual([
      'Pause', 'Insert', 'Delete', '↑', '→',
    ])
  })
})
