import { describe, expect, it } from 'vitest'
import type { KeymapCapture, NizDeviceInfo } from '../domain/types'
import {
  NIZ_COMMAND,
  packetType,
  parseKeymapRecord,
  summarizeKeymap,
} from '../protocol/nizProtocol'
import type {
  HidReportListener,
  HidTransport,
} from './contracts'
import { NizDeviceClient } from './nizDeviceClient'

const deviceInfo: NizDeviceInfo = {
  productName: '68pro',
  vendorId: 0x0483,
  productId: 0x5532,
  collections: [{
    usagePage: 0x8c,
    usage: 1,
    inputReportIds: [0],
    outputReportIds: [0],
  }],
}

const deviceInfo84: NizDeviceInfo = {
  productName: '84EC(S)BLe',
  vendorId: 0x0483,
  productId: 0x5129,
  collections: [{
    usagePage: 0xff00,
    usage: 1,
    inputReportIds: [0],
    outputReportIds: [0],
  }],
}

const deviceInfo87: NizDeviceInfo = {
  productName: '87EC(S)BLe',
  vendorId: 0x0483,
  productId: 0xffff,
  collections: [{
    usagePage: 0xff00,
    usage: 1,
    inputReportIds: [0],
    outputReportIds: [0],
  }],
}

const firmware68 = '68pro(S)BT;V1.0.3H;V2.0;'
const firmware84 = '84EC(S)BLe;test;'
const firmware87 = '87EC(S)BLe;test;'

class FakeTransport implements HidTransport {
  readonly supported = true
  connected = false
  private readonly listeners = new Set<HidReportListener>()
  readonly sentReports: number[][] = []
  private readonly device: NizDeviceInfo
  private readonly firmware: string

  constructor(
    device = deviceInfo,
    firmware = firmware68,
  ) {
    this.device = device
    this.firmware = firmware
  }

  async connect(): Promise<NizDeviceInfo> {
    this.connected = true
    return this.device
  }

  async disconnect(): Promise<void> {
    this.connected = false
  }

  async send(bytes: Uint8Array<ArrayBuffer>): Promise<void> {
    this.sentReports.push(Array.from(bytes))
    const command = packetType(bytes)
    if (command === NIZ_COMMAND.VERSION) {
      const text = Array.from(new TextEncoder().encode(this.firmware))
      queueMicrotask(() => this.emit([0x00, 0xf9, ...text, 0x00]))
      return
    }
    if (command === NIZ_COMMAND.READ_KEYMAP) {
      queueMicrotask(() => {
        this.emit([0x00, 0xf0, 0x01, 0x01, 0x00, 0x01, 0x01])
        this.emit([0x00, 0xf0, 0x02, 0x01, 0x00, 0x01, 0x0e])
        this.emit(Array.from({ length: 64 }, () => 0xf6))
      })
    }
  }

  subscribe(listener: HidReportListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(bytes: number[]): void {
    for (const listener of this.listeners) listener({ reportId: 0, bytes })
  }
}

function completeCapture(
  keyCount: 68 | 84 | 87 = 68,
  device = deviceInfo,
  firmware = firmware68,
): KeymapCapture {
  const records = Array.from({ length: 3 }, (_, layerIndex) => (
    Array.from({ length: keyCount }, (_, positionIndex) => {
      const raw = Array.from({ length: 64 }, () => 0)
      raw[1] = NIZ_COMMAND.KEY_DATA
      raw[2] = layerIndex + 1
      raw[3] = positionIndex + 1
      raw[4] = 0
      raw[5] = 1
      raw[6] = ((layerIndex * keyCount + positionIndex) % 250) + 1
      return parseKeymapRecord(raw)
    })
  )).flat()
  return {
    schemaVersion: 1,
    capturedAt: '2026-07-16T00:00:00.000Z',
    device,
    firmware,
    summary: summarizeKeymap(records),
    rawReports: records.map((record) => record.raw),
    records,
    otherReports: [],
  }
}

describe('NizDeviceClient', () => {
  it('reads version and keymap through the transport contract', async () => {
    const client = new NizDeviceClient(new FakeTransport())
    await expect(client.connect()).resolves.toEqual(deviceInfo)
    await expect(client.readVersion()).resolves.toBe(firmware68)
    const capture = await client.readKeymap()

    expect(capture.firmware).toBe('68pro(S)BT;V1.0.3H;V2.0;')
    expect(capture.summary).toMatchObject({
      recordCount: 2,
      maxPosition: 1,
      byLayer: { 1: 1, 2: 1 },
    })
    expect(capture.records[0]?.action).toEqual({ kind: 'keys', keycodes: [1] })
    await client.disconnect()
    client.dispose()
  })

  it('writes a complete capture using F1, 204 F0 reports, then F6', async () => {
    const transport = new FakeTransport()
    const client = new NizDeviceClient(transport)
    await client.connect()
    await client.readVersion()
    transport.sentReports.length = 0

    await client.writeKeymap(completeCapture())

    expect(transport.sentReports).toHaveLength(206)
    expect(packetType(transport.sentReports[0]!)).toBe(NIZ_COMMAND.WRITE_KEYMAP)
    expect(transport.sentReports.slice(1, -1).every((report) => (
      packetType(report) === NIZ_COMMAND.KEY_DATA
    ))).toBe(true)
    expect(transport.sentReports.at(-1)?.[0]).toBe(0)
    expect(transport.sentReports.at(-1)?.slice(1).every((byte) => (
      byte === NIZ_COMMAND.DATA_END
    ))).toBe(true)

    await client.disconnect()
    client.dispose()
  })

  it('writes an 84-key capture using F1, 252 F0 reports, then F6', async () => {
    const transport = new FakeTransport(deviceInfo84, firmware84)
    const client = new NizDeviceClient(transport)
    await client.connect()
    await client.readVersion()
    transport.sentReports.length = 0

    await client.writeKeymap(completeCapture(84, deviceInfo84, firmware84))

    expect(transport.sentReports).toHaveLength(254)
    expect(packetType(transport.sentReports[0]!)).toBe(NIZ_COMMAND.WRITE_KEYMAP)
    expect(transport.sentReports.slice(1, -1)).toHaveLength(252)
    expect(transport.sentReports.slice(1, -1).every((report) => (
      packetType(report) === NIZ_COMMAND.KEY_DATA
    ))).toBe(true)
    expect(transport.sentReports.at(-1)?.slice(1).every((byte) => (
      byte === NIZ_COMMAND.DATA_END
    ))).toBe(true)

    await client.disconnect()
    client.dispose()
  })

  it('writes an 87-key capture using F1, 261 F0 reports, then F6', async () => {
    const transport = new FakeTransport(deviceInfo87, firmware87)
    const client = new NizDeviceClient(transport)
    await client.connect()
    await client.readVersion()
    transport.sentReports.length = 0

    await client.writeKeymap(completeCapture(87, deviceInfo87, firmware87))

    expect(transport.sentReports).toHaveLength(263)
    expect(packetType(transport.sentReports[0]!)).toBe(NIZ_COMMAND.WRITE_KEYMAP)
    expect(transport.sentReports.slice(1, -1)).toHaveLength(261)
    expect(transport.sentReports.slice(1, -1).every((report) => (
      packetType(report) === NIZ_COMMAND.KEY_DATA
    ))).toBe(true)
    expect(transport.sentReports.at(-1)?.slice(1).every((byte) => (
      byte === NIZ_COMMAND.DATA_END
    ))).toBe(true)

    await client.disconnect()
    client.dispose()
  })
})
