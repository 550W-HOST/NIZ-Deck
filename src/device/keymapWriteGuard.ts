import type {
  KeymapCapture,
  KeymapRecord,
  KeymapWriteMismatch,
  KeymapWriteVerification,
} from '../domain/types'
import {
  NIZ_COMMAND,
  NIZ_REPORT_LENGTH,
  packetType,
} from '../protocol/nizProtocol'
import {
  detectNizDeviceKeyCount,
  isKnownNiz66Device,
  isSupportedNizKeyCount,
} from './nizDeviceModels'

const NIZ_MIN_LAYER_COUNT = 3
const NIZ_MAX_OMITTED_RECORDS = 1

function recordKey(record: Pick<KeymapRecord, 'layer' | 'position'>): string {
  return `${record.layer}:${record.position}`
}

function captureKeyCount(capture: KeymapCapture): number {
  if (isKnownNiz66Device(capture.device)) {
    throw new Error('The known 66-key NIZ model is not supported for keymap writing')
  }

  const deviceKeyCount = detectNizDeviceKeyCount(capture.device)
  if (deviceKeyCount !== null) {
    if (capture.summary.maxPosition !== deviceKeyCount) {
      throw new Error(`Expected a ${deviceKeyCount}-key capture for this keyboard`)
    }
    return deviceKeyCount
  }

  if (!isSupportedNizKeyCount(capture.summary.maxPosition)) {
    throw new Error('Expected a supported 68-, 84-, or 87-key capture')
  }
  return capture.summary.maxPosition
}

export function validateCompleteKeymapCapture(
  capture: KeymapCapture,
): readonly KeymapRecord[] {
  const keyCount = captureKeyCount(capture)
  const byKey = new Map<string, KeymapRecord>()
  const layers = new Set<number>()
  for (const record of capture.records) {
    if (
      record.layer < 1
      || record.position < 1
      || record.position > keyCount
    ) {
      throw new Error(
        `Keymap record is outside the supported range: layer ${record.layer}, position ${record.position}`,
      )
    }
    layers.add(record.layer)
    if (record.raw.length !== NIZ_REPORT_LENGTH) {
      throw new Error(
        `Layer ${record.layer}, position ${record.position} is not a ${NIZ_REPORT_LENGTH}-byte report`,
      )
    }
    if (
      packetType(record.raw) !== NIZ_COMMAND.KEY_DATA
      || record.raw[2] !== record.layer
      || record.raw[3] !== record.position
    ) {
      throw new Error(
        `Layer ${record.layer}, position ${record.position} has inconsistent raw data`,
      )
    }

    const key = recordKey(record)
    if (byKey.has(key)) {
      throw new Error(`Duplicate keymap record for layer ${record.layer}, position ${record.position}`)
    }
    byKey.set(key, record)
  }

  const orderedLayers = [...layers].sort((a, b) => a - b)
  if (orderedLayers.length < NIZ_MIN_LAYER_COUNT) {
    throw new Error(`Expected at least ${NIZ_MIN_LAYER_COUNT} keymap layers`)
  }
  if (orderedLayers.some((layer, index) => layer !== index + 1)) {
    throw new Error(`Expected contiguous keymap layers starting at 1; received ${orderedLayers.join(', ')}`)
  }

  const expectedRecordCount = orderedLayers.length * keyCount
  const omittedRecordCount = expectedRecordCount - capture.records.length
  if (omittedRecordCount < 0 || omittedRecordCount > NIZ_MAX_OMITTED_RECORDS) {
    throw new Error(
      `Expected ${expectedRecordCount} records across ${orderedLayers.length} layers, received ${capture.records.length}`,
    )
  }

  const ordered: KeymapRecord[] = []
  for (const layer of orderedLayers) {
    for (let position = 1; position <= keyCount; position += 1) {
      const record = byKey.get(`${layer}:${position}`)
      if (record) ordered.push(record)
    }
  }
  return ordered
}

export function encodeKeymapCommit(): Uint8Array<ArrayBuffer> {
  const report = new Uint8Array(NIZ_REPORT_LENGTH)
  report.fill(NIZ_COMMAND.DATA_END, 1)
  return report
}

export function compareCompleteKeymapCaptures(
  expectedCapture: KeymapCapture,
  actualCapture: KeymapCapture,
): KeymapWriteVerification {
  const expected = validateCompleteKeymapCapture(expectedCapture)
  const actual = validateCompleteKeymapCapture(actualCapture)
  const mismatches: KeymapWriteMismatch[] = []
  const actualByKey = new Map(actual.map((record) => [recordKey(record), record]))
  const expectedByKey = new Map(expected.map((record) => [recordKey(record), record]))

  for (const expectedRecord of expected) {
    const actualRecord = actualByKey.get(recordKey(expectedRecord))
    if (!actualRecord) {
      mismatches.push({
        layer: expectedRecord.layer,
        position: expectedRecord.position,
        reason: 'missing',
      })
      continue
    }
    for (let byteIndex = 0; byteIndex < NIZ_REPORT_LENGTH; byteIndex += 1) {
      const expectedByte = expectedRecord.raw[byteIndex]!
      const actualByte = actualRecord.raw[byteIndex]!
      if (expectedByte === actualByte) continue
      mismatches.push({
        layer: expectedRecord.layer,
        position: expectedRecord.position,
        reason: 'bytes',
        byteIndex,
        expected: expectedByte,
        actual: actualByte,
      })
      break
    }
  }


  for (const actualRecord of actual) {
    if (expectedByKey.has(recordKey(actualRecord))) continue
    mismatches.push({
      layer: actualRecord.layer,
      position: actualRecord.position,
      reason: 'unexpected',
    })
  }

  return { recordCount: expected.length, mismatches }
}
