import { describe, expect, it } from 'vitest'
import { layerAfterVerticalWheel } from './layerNavigation'

const layers = [1, 2, 3]

describe('layer wheel navigation', () => {
  it('moves down and up through the available layers', () => {
    expect(layerAfterVerticalWheel(layers, 1, 0, 20)).toBe(2)
    expect(layerAfterVerticalWheel(layers, 2, 0, -20)).toBe(1)
  })

  it('wraps between the first and last layers', () => {
    expect(layerAfterVerticalWheel(layers, 1, 0, -20)).toBe(3)
    expect(layerAfterVerticalWheel(layers, 3, 0, 20)).toBe(1)
  })

  it('leaves horizontal scrolling to the tab strip', () => {
    expect(layerAfterVerticalWheel(layers, 2, 30, 10)).toBe(2)
    expect(layerAfterVerticalWheel(layers, 2, 10, 10)).toBe(2)
  })

  it('recovers to the first available layer when the active layer is stale', () => {
    expect(layerAfterVerticalWheel(layers, 9, 0, 20)).toBe(1)
  })
})
