import type {
  KeyboardLayout,
  LayoutDetectionContext,
  LayoutSelection,
  ResolvedKeyboardLayout,
} from '../domain/keyboardLayout'
import {
  detectNizDeviceKeyCount,
  isKnownNiz66Device,
} from '../device/nizDeviceModels'
import { NIZ_68_LAYOUT } from './layout68'
import { NIZ_84_LAYOUT } from './layout84'

export const KEYBOARD_LAYOUTS: readonly KeyboardLayout[] = [
  NIZ_68_LAYOUT,
  NIZ_84_LAYOUT,
]

function findLayout(id: string): KeyboardLayout | undefined {
  return KEYBOARD_LAYOUTS.find((layout) => layout.id === id)
}

export function detectKeyboardLayout({
  device,
  capture,
}: LayoutDetectionContext): ResolvedKeyboardLayout | null {
  if (isKnownNiz66Device(device)) return null

  const deviceKeyCount = detectNizDeviceKeyCount(device)
  if (deviceKeyCount) {
    const layout = KEYBOARD_LAYOUTS.find(({ keyCount }) => keyCount === deviceKeyCount)
    if (layout) return { layout, source: 'device' }
  }

  const capturedLayout = KEYBOARD_LAYOUTS.find(
    ({ keyCount }) => keyCount === capture?.summary.maxPosition,
  )
  if (capturedLayout) {
    return { layout: capturedLayout, source: 'capture' }
  }

  return null
}

export function resolveKeyboardLayout(
  selection: LayoutSelection,
  context: LayoutDetectionContext,
): ResolvedKeyboardLayout {
  if (selection !== 'auto') {
    return {
      layout: findLayout(selection) ?? NIZ_68_LAYOUT,
      source: 'manual',
    }
  }

  return detectKeyboardLayout(context) ?? {
    layout: NIZ_68_LAYOUT,
    source: 'fallback',
  }
}

export function physicalKeyAt(
  layout: KeyboardLayout,
  position: number,
) {
  return layout.keys.find((key) => key.position === position)
}
