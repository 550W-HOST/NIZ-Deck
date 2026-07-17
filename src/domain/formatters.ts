import type { NizKeyAction } from './types'
import { keycodeName } from '../data/nizKeycodes'

export function actionLabel(action: NizKeyAction | undefined): string {
  if (!action) return 'Not loaded'
  if (action.kind === 'unset') return 'Unassigned'
  if (action.kind === 'keys') return action.keycodes.map(keycodeName).join(' + ')
  if (action.kind === 'emulate') return action.keycodes.map(keycodeName).join(' → ')
  if (action.kind === 'macro') return `Macro · ${action.events.length} events`
  return 'Unknown action'
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
