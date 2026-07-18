import { describe, expect, it } from 'vitest'
import type { NizKeyAction } from './types'
import {
  createKeymapDraftState,
  draftAssignmentFor,
  keyActionsEqual,
  keymapDraftChanges,
  keymapDraftReducer,
} from './keymapDraft'

const original: NizKeyAction = { kind: 'keys', keycodes: [1] }
const replacement: NizKeyAction = { kind: 'keys', keycodes: [67, 43] }

describe('keymap draft reducer', () => {
  it('keeps edited assignments separate from the source record', () => {
    const sourceRecord = {
      layer: 1,
      position: 4,
      action: original,
    }
    const state = keymapDraftReducer(createKeymapDraftState(), {
      type: 'assign',
      layer: 1,
      position: 4,
      original,
      assignment: replacement,
    })

    expect(sourceRecord.action).toBe(original)
    expect(draftAssignmentFor(state, sourceRecord)).toEqual(replacement)
    expect(keymapDraftChanges(state)).toHaveLength(1)
  })

  it('removes a change when the assignment returns to its source value', () => {
    const changed = keymapDraftReducer(createKeymapDraftState(), {
      type: 'assign',
      layer: 2,
      position: 8,
      original,
      assignment: replacement,
    })
    const restored = keymapDraftReducer(changed, {
      type: 'assign',
      layer: 2,
      position: 8,
      original,
      assignment: original,
    })

    expect(keymapDraftChanges(restored)).toHaveLength(0)
  })

  it('supports undo and redo across assignment changes', () => {
    const changed = keymapDraftReducer(createKeymapDraftState(), {
      type: 'assign',
      layer: 1,
      position: 1,
      original,
      assignment: replacement,
    })
    const undone = keymapDraftReducer(changed, { type: 'undo' })
    const redone = keymapDraftReducer(undone, { type: 'redo' })

    expect(keymapDraftChanges(undone)).toHaveLength(0)
    expect(keymapDraftChanges(redone)[0]?.assignment).toEqual(replacement)
  })

  it('reverts one key without discarding other draft assignments', () => {
    const first = keymapDraftReducer(createKeymapDraftState(), {
      type: 'assign',
      layer: 1,
      position: 1,
      original,
      assignment: replacement,
    })
    const second = keymapDraftReducer(first, {
      type: 'assign',
      layer: 1,
      position: 2,
      original,
      assignment: { kind: 'unset' },
    })
    const reverted = keymapDraftReducer(second, {
      type: 'revert',
      layer: 1,
      position: 1,
    })

    expect(keymapDraftChanges(reverted)).toEqual([{
      layer: 1,
      position: 2,
      original,
      assignment: { kind: 'unset' },
    }])
  })

  it('clears lifecycle state without leaving old-device history', () => {
    const changed = keymapDraftReducer(createKeymapDraftState(), {
      type: 'assign',
      layer: 1,
      position: 1,
      original,
      assignment: replacement,
    })
    const cleared = keymapDraftReducer(changed, { type: 'clear' })

    expect(cleared).toEqual(createKeymapDraftState())
    expect(keymapDraftReducer(cleared, { type: 'undo' })).toBe(cleared)
  })
})

describe('key action equality', () => {
  it('compares macro event payloads instead of object identity', () => {
    const macro: NizKeyAction = {
      kind: 'macro',
      repeatMode: 'count',
      repeatCount: 2,
      recordedDelay: true,
      automaticDelayMs: 20,
      events: [{ keycode: 43, marker: 1, delayMs: 25 }],
    }

    expect(keyActionsEqual(macro, { ...macro, events: [{ ...macro.events[0]! }] })).toBe(true)
    expect(keyActionsEqual(macro, {
      ...macro,
      events: [{ ...macro.events[0]!, delayMs: 30 }],
    })).toBe(false)
  })
})
