import { describe, expect, it } from 'vitest'
import type { KeymapCapture, KeymapRecord, NizDeviceInfo } from '../domain/types'
import { summarizeKeymap } from '../protocol/nizProtocol'
import { buildCompatibilityReport } from './compatibilityReport'
import { getNizDeviceSupport } from './nizDeviceModels'

const device: NizDeviceInfo = {
  productName: '87EC(S)BLe',
  vendorId: 0x0483,
  productId: 0x9001,
  collections: [{
    usagePage: 0xff00,
    usage: 1,
    inputReportIds: [0],
    outputReportIds: [0],
  }],
}

function capture(): KeymapCapture {
  const raw = Array.from({ length: 64 }, () => 0)
  raw[1] = 0xf0
  raw[2] = 1
  raw[3] = 1
  raw[4] = 0
  raw[5] = 2
  raw[6] = 42
  raw[7] = 222
  const record: KeymapRecord = {
    layer: 1,
    position: 1,
    functionType: 0,
    action: { kind: 'keys', keycodes: [42, 222] },
    raw,
  }
  return {
    schemaVersion: 1,
    capturedAt: '2026-07-17T00:00:00.000Z',
    device,
    firmware: 'test-firmware',
    summary: summarizeKeymap([record]),
    rawReports: [raw],
    records: [record],
    otherReports: [],
  }
}

describe('compatibility report', () => {
  it('exports device and structural probe data without keymap payloads', async () => {
    const support = getNizDeviceSupport(device, 87)!
    const report = await buildCompatibilityReport({
      device,
      firmware: 'test-firmware',
      support,
      capture: capture(),
      verification: { attempts: 2, consistent: true },
      generatedAt: '2026-07-17T01:00:00.000Z',
    })
    const json = JSON.stringify(report)

    expect(report.probe).toMatchObject({
      readAttempts: 2,
      consistent: true,
      capture: {
        positionsByLayer: { 1: [1] },
        functionTypes: { '0x00': 1 },
        rawReportCount: 1,
        rawReportLengths: [64],
        packetTypes: { '0xf0': 1 },
      },
    })
    expect(report.probe.capture?.rawReportsSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(json).not.toContain('"records"')
    expect(json).not.toContain('"rawReports"')
    expect(json).not.toContain('"keycodes":[')
    expect(json).not.toContain('"events":[')
  })

  it('can report a metadata-only selection without sending a probe', async () => {
    const unknownDevice = { ...device, productName: 'STM32 bootloader' }
    const support = getNizDeviceSupport(unknownDevice)!
    const report = await buildCompatibilityReport({
      device: unknownDevice,
      firmware: null,
      support,
      capture: null,
      verification: { attempts: 0, consistent: null },
    })

    expect(report.probe).toEqual({
      readAttempts: 0,
      consistent: null,
      capture: null,
    })
    expect(report.privacy.redacted).toBe(true)
  })
})
