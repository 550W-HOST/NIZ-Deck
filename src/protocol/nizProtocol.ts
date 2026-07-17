import type {
  KeymapRecord,
  KeymapSummary,
  NizKeyAction,
} from '../domain/types'

export const NIZ_COMMAND = Object.freeze({
  KEY_DATA: 0xf0,
  WRITE_KEYMAP: 0xf1,
  READ_KEYMAP: 0xf2,
  DATA_END: 0xf6,
  VERSION: 0xf9,
})

export const NIZ_REPORT_LENGTH = 64

export function packetType(bytes: ArrayLike<number>): number {
  if (bytes.length < 2) throw new RangeError('NIZ report is shorter than 2 bytes')
  return bytes[1]
}

export function encodeCommand(
  command: number,
  data: readonly number[] = [],
): Uint8Array<ArrayBuffer> {
  if (data.length > NIZ_REPORT_LENGTH - 2) {
    throw new RangeError('NIZ command data cannot exceed 62 bytes')
  }

  const report = new Uint8Array(NIZ_REPORT_LENGTH)
  report[0] = (command >> 8) & 0xff
  report[1] = command & 0xff
  report.set(data, 2)
  return report
}

export function decodeVersion(bytes: readonly number[]): string {
  if (packetType(bytes) !== NIZ_COMMAND.VERSION) {
    throw new Error('Expected a NIZ version report')
  }

  const payload = bytes.slice(2)
  const terminator = payload.indexOf(0)
  const textBytes = terminator === -1 ? payload : payload.slice(0, terminator)
  return new TextDecoder().decode(new Uint8Array(textBytes))
}

function boundedSlice(
  bytes: readonly number[],
  start: number,
  length: number,
): number[] {
  return bytes.slice(start, Math.min(start + length, bytes.length))
}

function parseMacroAction(
  bytes: readonly number[],
  functionType: number,
): NizKeyAction {
  const repeatMode = (['count', 'hold', 'toggle'] as const)[functionType - 2]
  if (!repeatMode) return { kind: 'unknown', data: bytes.slice(5) }

  const repeatCount = bytes[5] ?? 0
  const recordedDelay = (bytes[6] ?? 0) !== 0
  const automaticDelayMs = ((bytes[7] ?? 0) << 8) | (bytes[8] ?? 0)
  const dataSize = bytes[10] ?? 0
  const data = boundedSlice(bytes, 11, dataSize)

  if (recordedDelay) {
    const events = Array.from({ length: Math.floor(data.length / 4) }, (_, index) => {
      const offset = index * 4
      return {
        keycode: data[offset] ?? 0,
        marker: data[offset + 1] ?? 0,
        delayMs: ((data[offset + 2] ?? 0) << 8) | (data[offset + 3] ?? 0),
      }
    })
    return {
      kind: 'macro',
      repeatMode,
      repeatCount,
      recordedDelay,
      automaticDelayMs,
      events,
    }
  }

  return {
    kind: 'macro',
    repeatMode,
    repeatCount,
    recordedDelay,
    automaticDelayMs,
    events: data.map((keycode) => ({ keycode })),
  }
}

export function parseKeymapRecord(bytes: readonly number[]): KeymapRecord {
  if (packetType(bytes) !== NIZ_COMMAND.KEY_DATA) {
    throw new Error('Expected a NIZ key data report')
  }

  const layer = bytes[2] ?? 0
  const position = bytes[3] ?? 0
  const functionType = bytes[4] ?? 0
  let action: NizKeyAction

  if (functionType === 0x00) {
    const dataSize = bytes[5] ?? 0
    action = dataSize === 0
      ? { kind: 'unset' }
      : { kind: 'keys', keycodes: boundedSlice(bytes, 6, dataSize) }
  } else if (functionType === 0x01) {
    const delayMs = ((bytes[5] ?? 0) << 8) | (bytes[6] ?? 0)
    const dataSize = bytes[7] ?? 0
    action = {
      kind: 'emulate',
      delayMs,
      keycodes: boundedSlice(bytes, 8, dataSize),
    }
  } else if (functionType >= 0x02 && functionType <= 0x04) {
    action = parseMacroAction(bytes, functionType)
  } else {
    action = { kind: 'unknown', data: bytes.slice(5) }
  }

  return {
    layer,
    position,
    functionType,
    action,
    raw: Array.from(bytes),
  }
}

export function summarizeKeymap(records: readonly KeymapRecord[]): KeymapSummary {
  const byLayer: Record<number, number> = {}
  const byAction: KeymapSummary['byAction'] = {
    unset: 0,
    keys: 0,
    emulate: 0,
    macro: 0,
    unknown: 0,
  }
  let configuredRecords = 0
  let maxPosition = 0

  for (const record of records) {
    byLayer[record.layer] = (byLayer[record.layer] ?? 0) + 1
    byAction[record.action.kind] += 1
    maxPosition = Math.max(maxPosition, record.position)
    if (record.action.kind !== 'unset') configuredRecords += 1
  }

  return {
    recordCount: records.length,
    configuredRecords,
    maxPosition,
    byLayer,
    byAction,
  }
}
