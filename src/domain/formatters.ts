import type { NizKeyAction } from './types'
import { keycodeName } from '../data/nizKeycodes'

const BOARD_KEYCODE_LABELS: Readonly<Record<number, string>> = {
  27: 'Bksp',
  42: 'Caps',
  55: 'LShift',
  66: 'RShift',
  67: 'LCtrl',
  68: 'LWin',
  69: 'LAlt',
  71: 'RAlt',
  72: 'RWin',
  74: 'RCtrl',
  78: 'PrtSc',
  79: 'ScrLk',
  83: 'PgUp',
  86: 'PgDn',
  91: 'NumLock',
  92: 'Num /',
  93: 'Num *',
  107: 'Num Enter',
  108: 'Next',
  109: 'Previous',
  110: 'Media Stop',
  111: 'Play/Pause',
  113: 'Vol +',
  114: 'Vol -',
  126: 'Mouse ←',
  127: 'Mouse →',
  128: 'Mouse ↑',
  129: 'Mouse ↓',
  133: 'Wheel ↑',
  134: 'Wheel ↓',
  144: 'Bright -',
  145: 'Bright +',
  156: 'R Fn',
  166: 'L Fn',
  168: 'BT 1',
  169: 'BT 2',
  170: 'BT 3',
}

export function actionLabel(action: NizKeyAction | undefined): string {
  if (!action) return 'Not loaded'
  if (action.kind === 'unset') return 'Unassigned'
  if (action.kind === 'keys') return action.keycodes.map(keycodeName).join(' + ')
  if (action.kind === 'emulate') return action.keycodes.map(keycodeName).join(' → ')
  if (action.kind === 'macro') return `Macro · ${action.events.length} events`
  return 'Unknown action'
}

function boardKeycodeLabel(keycode: number): string {
  return BOARD_KEYCODE_LABELS[keycode] ?? keycodeName(keycode)
}

export function boardActionLabel(action: NizKeyAction): string {
  if (action.kind === 'unset') return '—'
  if (action.kind === 'keys') {
    return action.keycodes.length > 0
      ? action.keycodes.map(boardKeycodeLabel).join('+')
      : '—'
  }
  if (action.kind === 'emulate') {
    return action.keycodes.length > 0
      ? action.keycodes.map(boardKeycodeLabel).join('→')
      : '—'
  }
  if (action.kind === 'macro') return `Macro ${action.events.length}`
  return 'Unknown'
}

export function layerName(layer: number): string {
  if (layer === 1) return 'Base'
  if (layer === 2) return 'Right Fn'
  if (layer === 3) return 'Left Fn'
  return `Layer ${layer}`
}

export function formatHex(value: number, width = 4): string {
  return `0x${value.toString(16).padStart(width, '0').toUpperCase()}`
}
