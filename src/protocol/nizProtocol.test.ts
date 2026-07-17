import { describe, expect, it } from 'vitest'
import {
  NIZ_COMMAND,
  decodeVersion,
  encodeCommand,
  packetType,
  parseKeymapRecord,
  summarizeKeymap,
} from './nizProtocol'

const versionReport = [
  0x00, 0xf9, 0x36, 0x38, 0x70, 0x72, 0x6f, 0x28,
  0x53, 0x29, 0x42, 0x54, 0x3b, 0x56, 0x31, 0x2e,
  0x30, 0x2e, 0x33, 0x48, 0x3b, 0x56, 0x32, 0x2e,
  0x30, 0x3b, 0x00,
]

describe('NIZ protocol', () => {
  it('encodes a 64-byte command report', () => {
    const report = encodeCommand(NIZ_COMMAND.VERSION)
    expect(report).toHaveLength(64)
    expect(Array.from(report.slice(0, 3))).toEqual([0x00, 0xf9, 0x00])
  })

  it('decodes the observed 68pro firmware response', () => {
    expect(decodeVersion(versionReport)).toBe('68pro(S)BT;V1.0.3H;V2.0;')
  })

  it('accepts both observed data-end framing variants', () => {
    expect(packetType([0x00, 0xf6])).toBe(NIZ_COMMAND.DATA_END)
    expect(packetType([0xf6, 0xf6])).toBe(NIZ_COMMAND.DATA_END)
  })

  it('parses simultaneous keys and sequential key actions', () => {
    const keys = parseKeymapRecord([
      0x00, 0xf0, 0x01, 0x04, 0x00, 0x03, 0x04, 0x05, 0x06,
    ])
    const emulate = parseKeymapRecord([
      0x00, 0xf0, 0x02, 0x05, 0x01, 0x00, 0x64, 0x02, 0x14, 0x15,
    ])

    expect(keys.action).toEqual({ kind: 'keys', keycodes: [4, 5, 6] })
    expect(emulate.action).toEqual({
      kind: 'emulate',
      delayMs: 100,
      keycodes: [20, 21],
    })
    expect(summarizeKeymap([keys, emulate])).toMatchObject({
      recordCount: 2,
      configuredRecords: 2,
      maxPosition: 5,
      byLayer: { 1: 1, 2: 1 },
    })
  })
})
