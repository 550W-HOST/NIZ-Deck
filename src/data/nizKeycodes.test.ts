import { describe, expect, it } from 'vitest'
import {
  isModifierKeyboardCode,
  keycodeCategory,
  keycodeForKeyboardCode,
  keycodesForKeyboardChord,
  NIZ_KEYCODE_OPTIONS,
} from './nizKeycodes'

describe('NIZ keycode catalog', () => {
  it('exposes searchable options without the unassigned sentinel', () => {
    expect(NIZ_KEYCODE_OPTIONS).toHaveLength(178)
    expect(NIZ_KEYCODE_OPTIONS[0]).toMatchObject({ keycode: 1, label: 'Esc' })
    expect(NIZ_KEYCODE_OPTIONS.some((option) => option.keycode === 0)).toBe(false)
    expect(keycodeCategory(136)).toBe('Lighting')
    expect(keycodeCategory(166)).toBe('Device')
  })

  it('maps browser physical codes into NIZ keycodes', () => {
    expect(keycodeForKeyboardCode('KeyA')).toBe(43)
    expect(keycodeForKeyboardCode('ArrowLeft')).toBe(88)
    expect(keycodeForKeyboardCode('Unknown')).toBeUndefined()
    expect(isModifierKeyboardCode('ShiftLeft')).toBe(true)
  })

  it('captures a chord with canonical left-side modifiers', () => {
    expect(keycodesForKeyboardChord({
      code: 'KeyA',
      ctrlKey: true,
      metaKey: false,
      altKey: false,
      shiftKey: true,
    })).toEqual([67, 55, 43])
  })
})
