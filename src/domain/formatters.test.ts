import { describe, expect, it } from 'vitest'
import { actionLabel, boardActionLabel } from './formatters'

describe('key action labels', () => {
  it('keeps descriptive labels for inspectors and accessibility', () => {
    expect(actionLabel({ kind: 'keys', keycodes: [67, 43] })).toBe('Left Ctrl + A')
    expect(actionLabel({ kind: 'emulate', delayMs: 20, keycodes: [43, 44] }))
      .toBe('A → S')
  })

  it('formats compact labels for the keyboard surface', () => {
    expect(boardActionLabel({ kind: 'unset' })).toBe('—')
    expect(boardActionLabel({ kind: 'keys', keycodes: [67, 43] })).toBe('LCtrl+A')
    expect(boardActionLabel({ kind: 'emulate', delayMs: 20, keycodes: [43, 44] }))
      .toBe('A→S')
    expect(boardActionLabel({
      kind: 'macro',
      repeatMode: 'count',
      repeatCount: 1,
      recordedDelay: false,
      automaticDelayMs: 20,
      events: [{ keycode: 43 }, { keycode: 44 }],
    })).toBe('Macro 2')
    expect(boardActionLabel({ kind: 'unknown', data: [1, 2] })).toBe('Unknown')
  })
})
