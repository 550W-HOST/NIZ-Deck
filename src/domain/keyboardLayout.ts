import type { KeymapCapture, NizDeviceInfo } from './types'

export interface PhysicalKey {
  position: number
  label: string
  secondary?: string
  x: number
  y: number
  width: number
  height: number
  tone?: 'accent' | 'modifier'
}

export interface KeyboardLayout {
  id: string
  name: string
  shortName: string
  keyCount: number
  width: number
  height: number
  keys: readonly PhysicalKey[]
}

export type LayoutSelection = 'auto' | KeyboardLayout['id']
export type LayoutSource = 'device' | 'capture' | 'manual' | 'fallback'

export interface ResolvedKeyboardLayout {
  layout: KeyboardLayout
  source: LayoutSource
}

export interface LayoutDetectionContext {
  device: NizDeviceInfo | null
  capture: KeymapCapture | null
}
