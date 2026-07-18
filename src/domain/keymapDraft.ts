import type { KeymapRecord, NizKeyAction } from './types'

export interface DraftAssignmentChange {
  layer: number
  position: number
  original: NizKeyAction
  assignment: NizKeyAction
}

export type DraftAssignmentMap = Readonly<Record<string, DraftAssignmentChange>>

export interface KeymapDraftState {
  past: readonly DraftAssignmentMap[]
  present: DraftAssignmentMap
  future: readonly DraftAssignmentMap[]
}

export type KeymapDraftAction =
  | {
      type: 'assign'
      layer: number
      position: number
      original: NizKeyAction
      assignment: NizKeyAction
    }
  | { type: 'revert'; layer: number; position: number }
  | { type: 'clear' }
  | { type: 'undo' }
  | { type: 'redo' }

const MAX_HISTORY_LENGTH = 100

export function createKeymapDraftState(): KeymapDraftState {
  return { past: [], present: {}, future: [] }
}

export function draftRecordKey(
  record: Pick<KeymapRecord, 'layer' | 'position'>,
): string {
  return `${record.layer}:${record.position}`
}

function numberArraysEqual(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

export function keyActionsEqual(a: NizKeyAction, b: NizKeyAction): boolean {
  if (a.kind !== b.kind) return false

  switch (a.kind) {
    case 'unset':
      return true
    case 'keys':
      return b.kind === 'keys' && numberArraysEqual(a.keycodes, b.keycodes)
    case 'emulate':
      return b.kind === 'emulate'
        && a.delayMs === b.delayMs
        && numberArraysEqual(a.keycodes, b.keycodes)
    case 'macro':
      return b.kind === 'macro'
        && a.repeatMode === b.repeatMode
        && a.repeatCount === b.repeatCount
        && a.recordedDelay === b.recordedDelay
        && a.automaticDelayMs === b.automaticDelayMs
        && a.events.length === b.events.length
        && a.events.every((event, index) => {
          const other = b.events[index]
          return other !== undefined
            && event.keycode === other.keycode
            && event.delayMs === other.delayMs
            && event.marker === other.marker
        })
    case 'unknown':
      return b.kind === 'unknown' && numberArraysEqual(a.data, b.data)
  }
}

function commitSnapshot(
  state: KeymapDraftState,
  present: DraftAssignmentMap,
): KeymapDraftState {
  return {
    past: [...state.past.slice(-(MAX_HISTORY_LENGTH - 1)), state.present],
    present,
    future: [],
  }
}

export function keymapDraftReducer(
  state: KeymapDraftState,
  action: KeymapDraftAction,
): KeymapDraftState {
  if (action.type === 'undo') {
    const previous = state.past.at(-1)
    if (!previous) return state
    return {
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
    }
  }

  if (action.type === 'redo') {
    const next = state.future[0]
    if (!next) return state
    return {
      past: [...state.past, state.present],
      present: next,
      future: state.future.slice(1),
    }
  }

  if (action.type === 'clear') return createKeymapDraftState()

  const key = `${action.layer}:${action.position}`
  if (action.type === 'revert') {
    if (!state.present[key]) return state
    const present = { ...state.present }
    delete present[key]
    return commitSnapshot(state, present)
  }

  const existing = state.present[key]
  const original = existing?.original ?? action.original
  const currentAssignment = existing?.assignment ?? original
  if (keyActionsEqual(currentAssignment, action.assignment)) return state

  const present = { ...state.present }
  if (keyActionsEqual(original, action.assignment)) {
    delete present[key]
  } else {
    present[key] = {
      layer: action.layer,
      position: action.position,
      original,
      assignment: action.assignment,
    }
  }
  return commitSnapshot(state, present)
}

export function keymapDraftChanges(
  state: KeymapDraftState,
): readonly DraftAssignmentChange[] {
  return Object.values(state.present).sort(
    (a, b) => a.layer - b.layer || a.position - b.position,
  )
}

export function draftAssignmentFor(
  state: KeymapDraftState,
  record: Pick<KeymapRecord, 'layer' | 'position' | 'action'> | undefined,
): NizKeyAction | undefined {
  if (!record) return undefined
  return state.present[draftRecordKey(record)]?.assignment ?? record.action
}
