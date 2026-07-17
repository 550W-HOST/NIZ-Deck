export type DeviceStatus =
  | 'unsupported'
  | 'disconnected'
  | 'connecting'
  | 'reading-version'
  | 'reading-keymap'
  | 'validating-write'
  | 'writing-keymap'
  | 'verifying-keymap'
  | 'ready'
  | 'error'

export interface DeviceCollectionSummary {
  usagePage: number
  usage: number
  inputReportIds: number[]
  outputReportIds: number[]
}

export interface NizDeviceInfo {
  productName: string
  vendorId: number
  productId: number
  collections: DeviceCollectionSummary[]
}

export type NizKeyAction =
  | { kind: 'unset' }
  | { kind: 'keys'; keycodes: number[] }
  | { kind: 'emulate'; delayMs: number; keycodes: number[] }
  | {
      kind: 'macro'
      repeatMode: 'count' | 'hold' | 'toggle'
      repeatCount: number
      recordedDelay: boolean
      automaticDelayMs: number
      events: Array<{ keycode: number; delayMs?: number; marker?: number }>
    }
  | { kind: 'unknown'; data: number[] }

export interface KeymapRecord {
  layer: number
  position: number
  functionType: number
  action: NizKeyAction
  raw: number[]
}

export interface KeymapSummary {
  recordCount: number
  configuredRecords: number
  maxPosition: number
  byLayer: Record<number, number>
  byAction: Record<NizKeyAction['kind'], number>
}

export interface KeymapCapture {
  schemaVersion: 1
  capturedAt: string
  device: NizDeviceInfo
  firmware: string | null
  summary: KeymapSummary
  rawReports: number[][]
  records: KeymapRecord[]
  otherReports: number[][]
}

export interface ReadProgress {
  records: number
}

export interface KeymapWriteProgress {
  records: number
  total: number
}

export interface KeymapWriteMismatch {
  layer: number
  position: number
  reason: 'missing' | 'unexpected' | 'bytes'
  byteIndex?: number
  expected?: number
  actual?: number
}

export interface KeymapWriteVerification {
  recordCount: number
  mismatches: KeymapWriteMismatch[]
}
