import type {
  KeymapCapture,
  KeymapWriteProgress,
  NizDeviceInfo,
  ReadProgress,
} from '../domain/types'

export interface HidReport {
  reportId: number
  bytes: number[]
}

export type HidReportListener = (report: HidReport) => void

export interface HidTransport {
  readonly supported: boolean
  readonly connected: boolean
  connect(): Promise<NizDeviceInfo>
  disconnect(): Promise<void>
  send(bytes: Uint8Array<ArrayBuffer>): Promise<void>
  subscribe(listener: HidReportListener): () => void
}

export interface NizDeviceReader {
  connect(): Promise<NizDeviceInfo>
  disconnect(): Promise<void>
  readVersion(): Promise<string>
  readKeymap(onProgress?: (progress: ReadProgress) => void): Promise<KeymapCapture>
}

export interface NizDeviceWriter {
  writeKeymap(
    capture: KeymapCapture,
    onProgress?: (progress: KeymapWriteProgress) => void,
  ): Promise<void>
}
