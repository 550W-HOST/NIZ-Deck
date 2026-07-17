import type { KeymapCapture, NizDeviceInfo } from '../domain/types'
import type { NizDeviceSupport } from './nizDeviceModels'

export interface CompatibilityReadVerification {
  attempts: number
  consistent: boolean | null
}

export interface NizCompatibilityReport {
  schema: 'niz-deck-compatibility-report'
  schemaVersion: 1
  generatedAt: string
  device: NizDeviceInfo
  firmware: string | null
  support: NizDeviceSupport
  probe: {
    readAttempts: number
    consistent: boolean | null
    capture: null | {
      summary: KeymapCapture['summary']
      positionsByLayer: Record<string, number[]>
      functionTypes: Record<string, number>
      rawReportCount: number
      rawReportLengths: number[]
      packetTypes: Record<string, number>
      otherReportCount: number
      rawReportsSha256: string | null
    }
  }
  privacy: {
    redacted: true
    omittedFields: string[]
  }
}

function countValues(values: readonly number[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const value of values) {
    const key = `0x${value.toString(16).padStart(2, '0')}`
    counts[key] = (counts[key] ?? 0) + 1
  }
  return counts
}

function positionsByLayer(capture: KeymapCapture): Record<string, number[]> {
  const positions: Record<string, number[]> = {}
  for (const record of capture.records) {
    const layer = String(record.layer)
    ;(positions[layer] ??= []).push(record.position)
  }
  for (const values of Object.values(positions)) values.sort((a, b) => a - b)
  return positions
}

async function hashReports(reports: readonly number[][]): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null

  const byteLength = reports.reduce((total, report) => total + 2 + report.length, 0)
  const bytes = new Uint8Array(byteLength)
  const view = new DataView(bytes.buffer)
  let offset = 0
  for (const report of reports) {
    view.setUint16(offset, report.length, true)
    offset += 2
    bytes.set(report, offset)
    offset += report.length
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => (
    byte.toString(16).padStart(2, '0')
  )).join('')
}

export async function buildCompatibilityReport({
  device,
  firmware,
  support,
  capture,
  verification,
  generatedAt = new Date().toISOString(),
}: {
  device: NizDeviceInfo
  firmware: string | null
  support: NizDeviceSupport
  capture: KeymapCapture | null
  verification: CompatibilityReadVerification
  generatedAt?: string
}): Promise<NizCompatibilityReport> {
  const captureReport = capture === null ? null : {
    summary: capture.summary,
    positionsByLayer: positionsByLayer(capture),
    functionTypes: countValues(capture.records.map((record) => record.functionType)),
    rawReportCount: capture.rawReports.length,
    rawReportLengths: [...new Set(capture.rawReports.map((report) => report.length))].sort((a, b) => a - b),
    packetTypes: countValues(capture.rawReports.map((report) => report[1] ?? -1)),
    otherReportCount: capture.otherReports.length,
    rawReportsSha256: await hashReports(capture.rawReports),
  }

  return {
    schema: 'niz-deck-compatibility-report',
    schemaVersion: 1,
    generatedAt,
    device,
    firmware,
    support,
    probe: {
      readAttempts: verification.attempts,
      consistent: verification.consistent,
      capture: captureReport,
    },
    privacy: {
      redacted: true,
      omittedFields: ['keycodes', 'macro events', 'raw keymap reports'],
    },
  }
}
