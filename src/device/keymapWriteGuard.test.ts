import { describe, expect, it } from 'vitest'
import type { KeymapCapture, KeymapRecord, NizDeviceInfo } from '../domain/types'
import {
  NIZ_COMMAND,
  parseKeymapRecord,
  summarizeKeymap,
} from '../protocol/nizProtocol'
import {
  compareCompleteKeymapCaptures,
  encodeKeymapCommit,
  validateCompleteKeymapCapture,
} from './keymapWriteGuard'

const device68: NizDeviceInfo = {
  productName: '68pro',
  vendorId: 0x0483,
  productId: 0x5532,
  collections: [],
}

const device84: NizDeviceInfo = {
  productName: '84EC(S)BLe',
  vendorId: 0x0483,
  productId: 0x5129,
  collections: [],
}

const device66: NizDeviceInfo = {
  productName: '66EC',
  vendorId: 0x0483,
  productId: 0x512a,
  collections: [],
}

function makeRecord(layer: number, position: number, keyCount: number): KeymapRecord {
  const raw = Array.from({ length: 64 }, () => 0)
  raw[1] = NIZ_COMMAND.KEY_DATA
  raw[2] = layer
  raw[3] = position
  raw[4] = 0
  raw[5] = 1
  raw[6] = ((layer * keyCount + position) % 250) + 1
  return parseKeymapRecord(raw)
}

function makeCapture({
  layerCount = 3,
  keyCount = 68,
  device = device68,
}: {
  layerCount?: number
  keyCount?: 68 | 84
  device?: NizDeviceInfo
} = {}): KeymapCapture {
  const records = Array.from({ length: layerCount }, (_, layerIndex) => (
    Array.from({ length: keyCount }, (_, positionIndex) => (
      makeRecord(layerIndex + 1, positionIndex + 1, keyCount)
    ))
  )).flat()
  return {
    schemaVersion: 1,
    capturedAt: '2026-07-16T00:00:00.000Z',
    device,
    firmware: `${device.productName};test;`,
    summary: summarizeKeymap(records),
    rawReports: records.map((record) => record.raw),
    records,
    otherReports: [],
  }
}

describe('complete keymap write guard', () => {
  it('accepts and orders one complete 68-key, three-layer capture', () => {
    const capture = makeCapture()
    capture.records.reverse()
    const records = validateCompleteKeymapCapture(capture)

    expect(records).toHaveLength(204)
    expect(records[0]).toMatchObject({ layer: 1, position: 1 })
    expect(records.at(-1)).toMatchObject({ layer: 3, position: 68 })
  })

  it('rejects incomplete and malformed captures before 0xF1 can be sent', () => {
    const incomplete = makeCapture()
    incomplete.records.splice(-2)
    expect(() => validateCompleteKeymapCapture(incomplete)).toThrow(/Expected 204/)

    const malformed = makeCapture()
    malformed.records[0]!.raw.pop()
    expect(() => validateCompleteKeymapCapture(malformed)).toThrow(/64-byte/)
  })

  it('accepts the observed stable nine-layer capture with one omitted record', () => {
    const capture = makeCapture({ layerCount: 9 })
    capture.records.splice(100, 1)

    expect(validateCompleteKeymapCapture(capture)).toHaveLength(611)
  })

  it('accepts and orders a complete 84-key capture', () => {
    const capture = makeCapture({ keyCount: 84, device: device84 })
    capture.records.reverse()

    const records = validateCompleteKeymapCapture(capture)
    expect(records).toHaveLength(252)
    expect(records[0]).toMatchObject({ layer: 1, position: 1 })
    expect(records.at(-1)).toMatchObject({ layer: 3, position: 84 })
  })

  it('rejects truncated 84-key and known 66-key captures', () => {
    const truncated84 = makeCapture({ keyCount: 68, device: device84 })
    expect(() => validateCompleteKeymapCapture(truncated84)).toThrow(/Expected a 84-key/)

    const unsupported66 = makeCapture({ keyCount: 68, device: device66 })
    expect(() => validateCompleteKeymapCapture(unsupported66)).toThrow(/66-key.*not supported/)
  })

  it('encodes the required all-0xF6 commit payload', () => {
    const report = encodeKeymapCommit()
    expect(report).toHaveLength(64)
    expect(report[0]).toBe(0)
    expect(Array.from(report.slice(1)).every((byte) => byte === 0xf6)).toBe(true)
  })

  it('compares read-back data by layer, position, and raw bytes', () => {
    const expected = makeCapture()
    const matching = makeCapture()
    matching.records.reverse()
    expect(compareCompleteKeymapCaptures(expected, matching).mismatches).toEqual([])

    const changed = makeCapture()
    changed.records[70]!.raw[6] ^= 0xff
    expect(compareCompleteKeymapCaptures(expected, changed).mismatches).toEqual([{
      layer: 2,
      position: 3,
      reason: 'bytes',
      byteIndex: 6,
      expected: expected.records[70]!.raw[6],
      actual: changed.records[70]!.raw[6],
    }])
  })
})
